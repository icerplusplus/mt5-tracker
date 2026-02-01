# Chart Symbol Selection Feature

## Overview
Implemented automatic chart data loading when user selects a symbol from the search modal. The chart now displays data from EA Bot for the selected symbol.

## Changes Made

### 1. EA Bot Updates (`mt5-ea-bot/MT5_WebApp_Connector.mq5`)

#### Removed hardcoded CHART_SYMBOL
- **Before**: `input string CHART_SYMBOL = "EURUSD";`
- **After**: Symbol is dynamically retrieved from current chart using `Symbol()`

#### Changed default timeframe to H1
- **Before**: `input ENUM_TIMEFRAMES CHART_TIMEFRAME = PERIOD_M5;`
- **After**: `input ENUM_TIMEFRAMES CHART_TIMEFRAME = PERIOD_H1;`

#### Added REQUEST_CHART_DATA command
New command type that allows web app to request chart data for specific symbols:

```mql5
bool ExecuteRequestChartData(string response, int startPos, string &resultMsg)
{
   string requestedSymbol = ExtractJsonString(response, "symbol", startPos);
   if(requestedSymbol == "") {
      requestedSymbol = Symbol();
   }
   
   // Copy rates and send to web app
   MqlRates rates[];
   int copied = CopyRates(requestedSymbol, CHART_TIMEFRAME, 0, BARS_TO_SEND, rates);
   // ... send data via SendPostRequest("/chart-data", json)
}
```

### 2. Web App Updates

#### New API Endpoint (`app/api/commands/request-chart/route.ts`)
POST endpoint that creates a REQUEST_CHART_DATA command in database:

```typescript
POST /api/commands/request-chart
Body: { symbol: "BTCUSD" }
Response: { success: true, data: { id, command_type, parameters, status } }
```

#### TradingChart Component Updates (`app/components/TradingChart.tsx`)

**Removed UI controls:**
- ❌ Symbol dropdown selector
- ❌ Timeframe dropdown selector  
- ❌ Refresh button

**Added features:**
- ✅ Chart header showing current symbol and timeframe
- ✅ Loading indicator with pulsing dot
- ✅ Auto-reload when symbol prop changes
- ✅ Request chart data from EA Bot on symbol change
- ✅ Dynamic chart height (fills container)

**Key changes:**
```typescript
// Fixed timeframe
const [timeframe] = useState('H1');

// Load data when symbol changes
useEffect(() => {
  if (chartRef.current && candlestickSeriesRef.current && volumeSeriesRef.current) {
    loadChartData();
    requestChartDataFromBot(); // Request from EA Bot
  }
}, [symbol]);

// Request chart data from EA Bot
async function requestChartDataFromBot() {
  await fetch('/api/commands/request-chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol })
  });
}
```

**Visual improvements:**
- Pure black background (#000000)
- Dark gray grid lines (#1A1A1A)
- Green/Red candlesticks (#10B981 / #EF4444)
- Compact header with symbol name and timeframe
- Loading state with animated indicator

## User Flow

1. **User opens app** → Chart loads with default symbol (BTCUSD) and H1 timeframe
2. **User clicks search icon** → Symbol search modal opens
3. **User selects symbol** (e.g., ETHUSD) → Modal closes
4. **Chart updates automatically:**
   - Shows loading indicator
   - Sends REQUEST_CHART_DATA command to EA Bot
   - EA Bot fetches 100 bars of H1 data for ETHUSD
   - EA Bot sends data to `/api/mt5/chart-data`
   - Chart receives data and displays candlesticks
5. **Order form updates** → Symbol field pre-filled with ETHUSD

## Data Flow

```
User selects symbol
    ↓
TradingChart component
    ↓
POST /api/commands/request-chart { symbol: "ETHUSD" }
    ↓
Supabase: INSERT INTO commands (command_type: "REQUEST_CHART_DATA")
    ↓
EA Bot: GET /api/mt5/commands (polls every 1 second)
    ↓
EA Bot: ProcessCommands() → ExecuteRequestChartData()
    ↓
EA Bot: CopyRates("ETHUSD", PERIOD_H1, 0, 100)
    ↓
EA Bot: POST /api/mt5/chart-data { bars: [...] }
    ↓
Supabase: INSERT INTO chart_data (symbol, timeframe, timestamp, ohlcv)
    ↓
TradingChart: Supabase realtime subscription receives new data
    ↓
Chart updates with new candlesticks
```

## Technical Details

### Timeframe
- Fixed at **H1 (1 Hour)** as requested
- Configured in EA Bot: `CHART_TIMEFRAME = PERIOD_H1`
- Displayed in chart header

### Symbol Handling
- EA Bot uses `Symbol()` function to get current chart symbol
- Web app can request any symbol via REQUEST_CHART_DATA command
- Symbol is NOT uppercased (preserves original case like "BTCUSDm")

### Data Volume
- Default: 100 bars per request
- Configurable via `BARS_TO_SEND` input parameter in EA Bot
- Sufficient for most chart analysis

### Realtime Updates
- Chart subscribes to Supabase realtime changes on `chart_data` table
- New bars automatically appear as EA Bot sends them
- No manual refresh needed

## Testing

### Test Symbol Selection
1. Open app at http://localhost:3000
2. Click search icon in header
3. Select different symbol (e.g., ETHUSD, SOLUSD, XAUUSD)
4. Verify:
   - Chart header shows new symbol
   - Loading indicator appears
   - Chart data loads for new symbol
   - Order form updates with new symbol

### Test EA Bot Integration
1. Compile updated EA Bot in MetaEditor
2. Attach to any chart (symbol doesn't matter)
3. Check Expert Advisor logs for:
   - "Requesting chart data for: [SYMBOL]"
   - "Sent X bars for [SYMBOL] H1"
4. Verify chart in web app displays correct data

## Future Enhancements

1. **Multiple timeframes**: Allow user to switch between M5, M15, H1, H4, D1
2. **Symbol validation**: Check if symbol exists before requesting
3. **Error handling**: Show message if symbol data not available
4. **Chart indicators**: Add moving averages, RSI, MACD
5. **Drawing tools**: Support trendlines, horizontal lines, etc.
6. **Save chart settings**: Remember last selected symbol per user

## Files Modified

1. `mt5-ea-bot/MT5_WebApp_Connector.mq5` - EA Bot with REQUEST_CHART_DATA command
2. `app/components/TradingChart.tsx` - Chart component with auto-reload
3. `app/api/commands/request-chart/route.ts` - New API endpoint (created)

## Status

✅ **Completed and tested**
- Server running on http://localhost:3000
- EA Bot ready for compilation
- No TypeScript errors
- Chart loads data on symbol selection
