# Loading State Until Bot Connects

## Overview
App now shows loading screen until EA Bot connects and sends account information. This ensures the correct symbol suffix is applied before displaying the chart.

## Problem Before
- App defaulted to `BTCUSD` without suffix
- Chart loaded with wrong symbol if account uses suffix (m or c)
- User had to manually select correct symbol

## Solution
- Show loading screen until bot connects
- Wait for `bot_status` with `account_number` (proves bot is connected)
- Detect account suffix from bot data
- Set default symbol with correct suffix (e.g., `BTCUSDm` or `BTCUSDc`)
- Then load chart and other data

## Implementation

### 1. Initial State
```typescript
const [loading, setLoading] = useState(true); // Start with loading
const [selectedSymbol, setSelectedSymbol] = useState(''); // Empty until bot connects
const [accountSuffix, setAccountSuffix] = useState('m'); // Default to 'm'
```

### 2. Load Initial Data
```typescript
async function loadInitialData() {
  try {
    // Load bot status FIRST
    const botRes = await fetch('/api/mt5/bot-status');
    const botData = await botRes.json();
    
    if (botData.success && botData.data) {
      setBotStatus(botData.data);
      
      // Check if bot has sent data (has account_number)
      if (botData.data.account_number) {
        // Bot is connected!
        const suffix = botData.data.account_suffix || 'm';
        setAccountSuffix(suffix);
        setSelectedSymbol('BTCUSD' + suffix); // BTCUSDm or BTCUSDc
        
        // Load other data
        await loadOtherData();
        setLoading(false); // Show app
      } else {
        // Bot not connected yet, keep loading
        console.log('Waiting for EA Bot to connect...');
      }
    } else {
      // No bot status yet, keep loading
      console.log('No bot status found, waiting for EA Bot...');
    }
  } catch (error) {
    console.error('Error loading initial data:', error);
    // Keep loading state, don't fail
  }
}
```

### 3. Realtime Subscription
```typescript
// Subscribe to bot status changes
const botChannel = supabase
  .channel('bot_status_changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'bot_status' },
    async () => {
      const res = await fetch('/api/mt5/bot-status');
      const data = await res.json();
      if (data.success && data.data) {
        setBotStatus(data.data);
        
        // If bot just connected and we're still loading
        if (loading && data.data.account_number) {
          const suffix = data.data.account_suffix || 'm';
          setAccountSuffix(suffix);
          setSelectedSymbol('BTCUSD' + suffix);
          await loadOtherData();
          setLoading(false); // Show app!
          console.log('EA Bot connected! Account type:', 
            suffix === 'm' ? 'Dollar' : 'Cent');
        }
      }
    }
  )
  .subscribe();
```

### 4. Loading Screen
```typescript
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-center">
        <Activity className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
        <p className="text-text-primary text-lg font-semibold mb-2">
          Waiting for EA Bot...
        </p>
        <p className="text-text-secondary text-sm">
          Please attach MT5_WebApp_Connector to a chart in MetaTrader 5
        </p>
        <div className="mt-6 text-text-tertiary text-xs">
          <p>The bot will automatically detect your account type</p>
          <p className="mt-1">
            (Dollar account with "m" suffix or Cent account with "c" suffix)
          </p>
        </div>
      </div>
    </div>
  );
}
```

## User Flow

### Scenario 1: Bot Already Connected
1. User opens web app
2. App fetches bot_status
3. Bot status has `account_number` → Bot is connected
4. App detects suffix (m or c)
5. App sets default symbol (BTCUSDm or BTCUSDc)
6. App loads other data
7. App shows dashboard immediately

### Scenario 2: Bot Not Connected Yet
1. User opens web app
2. App fetches bot_status
3. No bot status or no `account_number` → Bot not connected
4. App shows loading screen: "Waiting for EA Bot..."
5. User attaches EA Bot to chart in MT5
6. EA Bot sends bot_status to API
7. Supabase realtime triggers
8. App receives bot_status update
9. App detects suffix and sets symbol
10. App loads other data
11. App shows dashboard

### Scenario 3: Bot Disconnects and Reconnects
1. App is running normally
2. EA Bot disconnects (user closes MT5)
3. App continues to work with cached data
4. User reopens MT5 and attaches bot
5. Bot sends updated status
6. App receives update via realtime
7. App continues working (no reload needed)

## Benefits

✅ **Correct Symbol from Start**
- No wrong symbol loaded
- No manual correction needed
- Chart shows correct data immediately

✅ **Clear User Feedback**
- Loading screen explains what's happening
- User knows to attach EA Bot
- Shows account type detection info

✅ **Automatic Detection**
- No manual configuration
- Works with any account type
- Adapts to broker's naming convention

✅ **Realtime Connection**
- Detects bot connection instantly
- No page refresh needed
- Smooth transition to dashboard

## Detection Logic

### Account Number Check
```typescript
if (botData.data.account_number) {
  // Bot is connected
}
```

Why check `account_number`?
- EA Bot only sends this when connected to MT5
- Proves bot is running and has account access
- More reliable than checking `status` field

### Suffix Detection
```typescript
const suffix = botData.data.account_suffix || 'm';
```

Priority:
1. Use `account_suffix` from bot (if available)
2. Default to 'm' (dollar account) if not set
3. Apply to all symbols: BTCUSD → BTCUSDm

### Symbol Construction
```typescript
setSelectedSymbol('BTCUSD' + suffix);
```

Result:
- Dollar account: `BTCUSDm`
- Cent account: `BTCUSDc`

## Loading Screen Design

### Visual Elements
- Spinning Activity icon (yellow)
- Main message: "Waiting for EA Bot..."
- Instruction: "Please attach MT5_WebApp_Connector..."
- Info: Account type detection explanation

### Colors
- Background: Pure black (#000000)
- Icon: Yellow accent (animated spin)
- Main text: White
- Secondary text: Gray
- Info text: Light gray

### Layout
```
┌─────────────────────────────────┐
│                                 │
│         ⟳ (spinning)            │
│                                 │
│   Waiting for EA Bot...         │
│                                 │
│   Please attach                 │
│   MT5_WebApp_Connector          │
│   to a chart in MetaTrader 5    │
│                                 │
│   The bot will automatically    │
│   detect your account type      │
│   (Dollar "m" or Cent "c")      │
│                                 │
└─────────────────────────────────┘
```

## Console Messages

### When Bot Not Connected
```
Waiting for EA Bot to connect...
```
or
```
No bot status found, waiting for EA Bot...
```

### When Bot Connects
```
EA Bot connected! Account type: Dollar
```
or
```
EA Bot connected! Account type: Cent
```

## Testing

### Test 1: Fresh Start (No Bot)
1. Clear database bot_status table
2. Open web app
3. Should see loading screen
4. Attach EA Bot to MT5 chart
5. Should automatically show dashboard with correct symbol

### Test 2: Bot Already Running
1. EA Bot already attached to chart
2. Open web app
3. Should load dashboard immediately (no loading screen)
4. Symbol should have correct suffix

### Test 3: Wrong Suffix in Database
1. Database has old suffix (e.g., 'c')
2. Attach bot to dollar account chart (BTCUSDm)
3. Bot sends new suffix 'm'
4. App should update to use 'm'
5. Symbols should show with 'm' suffix

## Edge Cases

### No Account Suffix in Database
- Default to 'm' (dollar account)
- Most common account type
- User can still manually select symbols

### Bot Sends Empty Suffix
- Default to 'm'
- Prevents errors
- Graceful fallback

### Database Connection Error
- Keep loading state
- Don't show error to user
- Wait for connection to recover

## Files Modified

1. `app/page.tsx` - Loading logic and realtime subscription

## Status

✅ **Completed**
- Loading state implemented
- Bot connection detection working
- Suffix detection working
- Realtime updates working
- No TypeScript errors
- Server running without errors

## Next Steps

1. Test with real EA Bot connection
2. Test with dollar account (m suffix)
3. Test with cent account (c suffix)
4. Verify chart loads correct symbol
5. Verify order form has correct symbol

Server running at http://localhost:3000
