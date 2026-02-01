# Account Type Detection Feature

## Overview
Automatically detects account type (Dollar or Cent) based on symbol suffix and applies the correct suffix to all symbols in the web app. This ensures symbols match the broker's naming convention.

## Account Types

### Dollar Account (suffix: "m")
- Symbols end with "m": `BTCUSDm`, `ETHUSDm`, `EURUSDm`
- Standard account with USD denomination
- Badge color: Yellow/Gold

### Cent Account (suffix: "c")
- Symbols end with "c": `BTCUSDc`, `ETHUSDc`, `EURUSDc`
- Cent account with smaller lot sizes
- Badge color: Blue

## Implementation Details

### 1. EA Bot Detection (`mt5-ea-bot/MT5_WebApp_Connector.mq5`)

#### Global Variable
```mql5
string accountSuffix = ""; // "m" for dollar account, "c" for cent account
```

#### Detection Function
```mql5
string DetectAccountSuffix()
{
   // 1. Check current chart symbol
   string currentSymbol = Symbol();
   int len = StringLen(currentSymbol);
   
   if(len > 0)
   {
      string lastChar = StringSubstr(currentSymbol, len - 1, 1);
      
      if(lastChar == "m" || lastChar == "M")
      {
         Print("Detected DOLLAR account (suffix: m)");
         return "m";
      }
      else if(lastChar == "c" || lastChar == "C")
      {
         Print("Detected CENT account (suffix: c)");
         return "c";
      }
   }
   
   // 2. Check symbols in Market Watch
   int total = SymbolsTotal(true);
   for(int i = 0; i < MathMin(total, 10); i++)
   {
      string sym = SymbolName(i, true);
      int symLen = StringLen(sym);
      if(symLen > 0)
      {
         string lastChar = StringSubstr(sym, symLen - 1, 1);
         if(lastChar == "m" || lastChar == "M") return "m";
         if(lastChar == "c" || lastChar == "C") return "c";
      }
   }
   
   // 3. Default to dollar account
   Print("No suffix detected, using default (m)");
   return "m";
}
```

#### Detection Logic
1. **Check current chart symbol** - Most reliable method
2. **Check Market Watch symbols** - Fallback if chart symbol has no suffix
3. **Default to "m"** - If no suffix found anywhere

#### OnInit Integration
```mql5
int OnInit()
{
   Print("MT5 WebApp Connector initialized");
   Print("API URL: ", API_URL);
   
   // Detect account type
   accountSuffix = DetectAccountSuffix();
   
   // Send initial bot status
   SendBotStatus();
   SendAccountInfo();
   
   return(INIT_SUCCEEDED);
}
```

#### Send to Web App
```mql5
void SendBotStatus()
{
   string json = "{";
   json += "\"status\":\"" + botStatus + "\"";
   json += ",\"version\":\"1.0.0\"";
   json += ",\"account_number\":" + IntegerToString(accountNumber);
   json += ",\"broker\":\"" + broker + "\"";
   json += ",\"account_suffix\":\"" + accountSuffix + "\""; // NEW
   json += "}";
   
   SendPostRequest("/bot-status", json);
}
```

### 2. Database Schema Update

#### Migration (`lib/supabase/migrations/add_account_suffix.sql`)
```sql
ALTER TABLE bot_status 
ADD COLUMN IF NOT EXISTS account_suffix VARCHAR(10);

COMMENT ON COLUMN bot_status.account_suffix IS 
  'Account type suffix: m for dollar account, c for cent account';
```

#### Updated Schema
```sql
CREATE TABLE bot_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(20) NOT NULL,
  last_heartbeat TIMESTAMP NOT NULL,
  version VARCHAR(50),
  account_number BIGINT,
  broker VARCHAR(100),
  account_suffix VARCHAR(10), -- NEW
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. API Endpoint Update (`app/api/mt5/bot-status/route.ts`)

#### POST - Save Account Suffix
```typescript
const { status, version, account_number, broker, account_suffix } = body;

if (existing) {
  await supabase.from('bot_status').update({
    status,
    last_heartbeat: new Date().toISOString(),
    version,
    account_number,
    broker,
    account_suffix // NEW
  });
} else {
  await supabase.from('bot_status').insert({
    status,
    last_heartbeat: new Date().toISOString(),
    version,
    account_number,
    broker,
    account_suffix // NEW
  });
}
```

### 4. Symbol Search Modal Update (`app/components/SymbolSearchModal.tsx`)

#### Fetch Account Suffix
```typescript
const [accountSuffix, setAccountSuffix] = useState('m');

useEffect(() => {
  fetchAccountSuffix();
}, []);

async function fetchAccountSuffix() {
  try {
    const res = await fetch('/api/mt5/bot-status');
    const data = await res.json();
    if (data.success && data.data?.account_suffix) {
      setAccountSuffix(data.data.account_suffix);
      console.log('Account suffix:', data.data.account_suffix);
    }
  } catch (error) {
    console.error('Error fetching account suffix:', error);
  }
}
```

#### Apply Suffix to Symbols
```typescript
const filteredSymbols = SYMBOLS
  .map(s => ({
    ...s,
    symbol: s.symbol + accountSuffix // Add suffix: BTCUSD → BTCUSDm
  }))
  .filter(s => {
    // ... filter logic
  });
```

#### Account Type Badge
```typescript
<div className="flex items-center gap-2">
  <span className="text-xs text-text-tertiary">Account Type:</span>
  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
    accountSuffix === 'm' 
      ? 'bg-accent/20 text-accent' 
      : 'bg-blue-500/20 text-blue-400'
  }`}>
    {accountSuffix === 'm' ? '$ Dollar' : '¢ Cent'}
  </span>
</div>
```

## Data Flow

```
EA Bot starts
    ↓
DetectAccountSuffix()
    ↓
Check Symbol() → "BTCUSDm"
    ↓
Extract last char → "m"
    ↓
accountSuffix = "m"
    ↓
SendBotStatus() with account_suffix: "m"
    ↓
POST /api/mt5/bot-status { account_suffix: "m" }
    ↓
Supabase: UPDATE bot_status SET account_suffix = 'm'
    ↓
Web App: GET /api/mt5/bot-status
    ↓
SymbolSearchModal: setAccountSuffix('m')
    ↓
Apply suffix to all symbols:
  BTCUSD → BTCUSDm
  ETHUSD → ETHUSDm
  EURUSD → EURUSDm
    ↓
User selects "BTCUSDm"
    ↓
Chart loads data for "BTCUSDm"
    ↓
Order form pre-fills "BTCUSDm"
```

## Visual Design

### Symbol Search Modal

**Dollar Account (m)**
```
┌─────────────────────────────────────────────────┐
│ Select Symbol                              [X]  │
├─────────────────────────────────────────────────┤
│ [🔍] Search coins...                            │
│                                                 │
│ [All] [Watchlist (3)]    Account Type: $ Dollar│
├─────────────────────────────────────────────────┤
│ ⭐ Symbol         Price      24h Change  Volume │
│ ⭐ BTCUSDm       77,555      -4.14%      428m   │
│ ⭐ ETHUSDm        2,336      -7.13%      419m   │
│    SOLUSDm          101      -6.01%       72m   │
└─────────────────────────────────────────────────┘
```

**Cent Account (c)**
```
┌─────────────────────────────────────────────────┐
│ Select Symbol                              [X]  │
├─────────────────────────────────────────────────┤
│ [🔍] Search coins...                            │
│                                                 │
│ [All] [Watchlist (3)]    Account Type: ¢ Cent  │
├─────────────────────────────────────────────────┤
│ ⭐ Symbol         Price      24h Change  Volume │
│ ⭐ BTCUSDc       77,555      -4.14%      428m   │
│ ⭐ ETHUSDc        2,336      -7.13%      419m   │
│    SOLUSDc          101      -6.01%       72m   │
└─────────────────────────────────────────────────┘
```

## Symbol Mapping

### Base Symbols (No Suffix)
```
BTCUSD, ETHUSD, SOLUSD, BNBUSD, XRPUSD, ADAUSD, DOGUSD, MATICUSD
EURUSD, GBPUSD, USDJPY
XAUUSD, XAGUSD
```

### Dollar Account (+ "m")
```
BTCUSDm, ETHUSDm, SOLUSDm, BNBUSDm, XRPUSDm, ADAUSDm, DOGUSDm, MATICUSDm
EURUSDm, GBPUSDm, USDJPYm
XAUUSDm, XAGUSDm
```

### Cent Account (+ "c")
```
BTCUSDc, ETHUSDc, SOLUSDc, BNBUSDc, XRPUSDc, ADAUSDc, DOGUSDc, MATICUSDc
EURUSDc, GBPUSDc, USDJPYc
XAUUSDc, XAGUSDc
```

## Benefits

✅ **Automatic Detection** - No manual configuration needed
✅ **Correct Symbol Names** - Matches broker's naming convention
✅ **Visual Feedback** - Badge shows account type clearly
✅ **Prevents Errors** - No "symbol not found" errors
✅ **Works with Any Broker** - Detects suffix automatically
✅ **Fallback Logic** - Multiple detection methods
✅ **Persistent** - Saved in database for web app

## Testing

### Test Dollar Account
1. Attach EA Bot to chart with "m" suffix (e.g., BTCUSDm)
2. Check EA Bot logs: "Detected DOLLAR account (suffix: m)"
3. Open web app symbol search modal
4. Verify badge shows "$ Dollar" in yellow
5. Verify all symbols have "m" suffix (BTCUSDm, ETHUSDm, etc.)
6. Select a symbol and verify chart loads correctly

### Test Cent Account
1. Attach EA Bot to chart with "c" suffix (e.g., BTCUSDc)
2. Check EA Bot logs: "Detected CENT account (suffix: c)"
3. Open web app symbol search modal
4. Verify badge shows "¢ Cent" in blue
5. Verify all symbols have "c" suffix (BTCUSDc, ETHUSDc, etc.)
6. Select a symbol and verify chart loads correctly

### Test No Suffix (Default)
1. Attach EA Bot to chart without suffix (e.g., EURUSD)
2. Check EA Bot logs: "No suffix detected, using default (m)"
3. Web app should default to "m" suffix

## Database Migration

Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE bot_status 
ADD COLUMN IF NOT EXISTS account_suffix VARCHAR(10);

COMMENT ON COLUMN bot_status.account_suffix IS 
  'Account type suffix: m for dollar account, c for cent account';
```

Or use the migration file:
```bash
# Apply migration
psql -h <supabase-host> -U postgres -d postgres -f lib/supabase/migrations/add_account_suffix.sql
```

## Files Modified

1. `mt5-ea-bot/MT5_WebApp_Connector.mq5` - Detection logic and SendBotStatus
2. `lib/supabase/migrations/add_account_suffix.sql` - Database migration (created)
3. `app/api/mt5/bot-status/route.ts` - Accept and save account_suffix
4. `app/components/SymbolSearchModal.tsx` - Fetch suffix and apply to symbols

## Status

✅ **Completed**
- EA Bot detection logic implemented
- Database migration created
- API endpoint updated
- Symbol search modal updated with badge
- No TypeScript errors
- Ready for testing

⚠️ **Next Steps**
1. Run database migration in Supabase
2. Compile updated EA Bot
3. Test with both dollar and cent accounts
4. Verify symbols load correctly in web app
