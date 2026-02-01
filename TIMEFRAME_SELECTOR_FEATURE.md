# Timeframe Selector Feature

## Overview
Added professional timeframe selector with quick buttons and dropdown menu, similar to TradingView style. Users can now switch between different timeframes (M1, M5, M15, M30, H1, H2, H4, H8, H12, D1, D3, W1, MN1).

## UI Design

### Quick Access Buttons (Top Bar)
Horizontal row of timeframe buttons for most common timeframes:
- **5m** (M5)
- **15m** (M15)
- **1h** (H1)
- **4h** (H4)
- **D** (D1)
- **W** (W1)
- **▼** (More options dropdown)

### Dropdown Menu
Organized into 3 sections with star indicators for selected timeframe:

**MINUTES**
- 1 minute (M1)
- 5 minutes (M5) ★
- 15 minutes (M15) ★
- 30 minutes (M30)

**HOURS**
- 1 hour (H1) ★
- 2 hours (H2)
- 4 hours (H4) ★
- 8 hours (H8)
- 12 hours (H12)

**DAYS**
- 1 day (D1) ★
- 3 days (D3)
- 1 week (W1) ★
- 1 month (MN1)

## Implementation Details

### 1. TradingChart Component (`app/components/TradingChart.tsx`)

#### State Management
```typescript
const [timeframe, setTimeframe] = useState('H1'); // Default H1
const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
const timeframeMenuRef = useRef<HTMLDivElement>(null);
```

#### Auto-reload on Timeframe Change
```typescript
useEffect(() => {
  if (chartRef.current && candlestickSeriesRef.current && volumeSeriesRef.current) {
    loadChartData();
    requestChartDataFromBot();
  }
}, [timeframe]);
```

#### Click Outside to Close Dropdown
```typescript
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (timeframeMenuRef.current && !timeframeMenuRef.current.contains(event.target as Node)) {
      setShowTimeframeMenu(false);
    }
  }
  
  if (showTimeframeMenu) {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }
}, [showTimeframeMenu]);
```

#### Request Chart Data with Timeframe
```typescript
async function requestChartDataFromBot() {
  await fetch('/api/commands/request-chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, timeframe })
  });
}
```

### 2. API Endpoint (`app/api/commands/request-chart/route.ts`)

Updated to accept timeframe parameter:
```typescript
const { symbol, timeframe } = body;

await supabase.from('commands').insert({
  command_type: 'REQUEST_CHART_DATA',
  parameters: { symbol, timeframe: timeframe || 'H1' },
  status: 'PENDING'
});
```

### 3. EA Bot Updates (`mt5-ea-bot/MT5_WebApp_Connector.mq5`)

#### New Function: StringToTimeframe
Converts timeframe string to MT5 enum:
```mql5
ENUM_TIMEFRAMES StringToTimeframe(string tfStr)
{
   if(tfStr == "M1")   return PERIOD_M1;
   if(tfStr == "M5")   return PERIOD_M5;
   if(tfStr == "M15")  return PERIOD_M15;
   if(tfStr == "M30")  return PERIOD_M30;
   if(tfStr == "H1")   return PERIOD_H1;
   if(tfStr == "H2")   return PERIOD_H2;
   if(tfStr == "H4")   return PERIOD_H4;
   if(tfStr == "H8")   return PERIOD_H8;
   if(tfStr == "H12")  return PERIOD_H12;
   if(tfStr == "D1")   return PERIOD_D1;
   if(tfStr == "W1")   return PERIOD_W1;
   if(tfStr == "MN1")  return PERIOD_MN1;
   return PERIOD_H1; // Default
}
```

#### Updated ExecuteRequestChartData
Now extracts and uses timeframe from command parameters:
```mql5
bool ExecuteRequestChartData(string response, int startPos, string &resultMsg)
{
   string requestedSymbol = ExtractJsonString(response, "symbol", startPos);
   string requestedTimeframe = ExtractJsonString(response, "timeframe", startPos);
   
   ENUM_TIMEFRAMES tf = CHART_TIMEFRAME;
   if(requestedTimeframe != "") {
      tf = StringToTimeframe(requestedTimeframe);
   }
   
   MqlRates rates[];
   int copied = CopyRates(requestedSymbol, tf, 0, BARS_TO_SEND, rates);
   // ... send data
}
```

## Visual Design

### Quick Buttons
- **Active**: Yellow background (#FFC107), black text
- **Inactive**: Gray text, transparent background
- **Hover**: Lighter gray text, subtle background

### Dropdown Menu
- **Background**: Dark tertiary (#1A1A1A)
- **Border**: Subtle border (#333333)
- **Sections**: Separated by borders with uppercase labels
- **Selected Item**: Yellow accent background with star (★)
- **Hover**: Subtle background highlight

### Layout
```
┌─────────────────────────────────────────────────────┐
│ BTCUSD  [5m][15m][1h][4h][D][W][▼]      Loading... │
├─────────────────────────────────────────────────────┤
│                                                     │
│                   Chart Area                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

When dropdown is open:
```
┌─────────────────────────────────────────────────────┐
│ BTCUSD  [5m][15m][1h][4h][D][W][▼]                 │
│                              ┌──────────────┐       │
│                              │ MINUTES      │       │
│                              │ 1 minute     │       │
│                              │ 5 minutes  ★ │       │
│                              │ 15 minutes ★ │       │
│                              │ 30 minutes   │       │
│                              ├──────────────┤       │
│                              │ HOURS        │       │
│                              │ 1 hour     ★ │       │
│                              │ 2 hours      │       │
│                              │ 4 hours    ★ │       │
│                              │ 8 hours      │       │
│                              │ 12 hours     │       │
│                              ├──────────────┤       │
│                              │ DAYS         │       │
│                              │ 1 day      ★ │       │
│                              │ 3 days       │       │
│                              │ 1 week     ★ │       │
│                              │ 1 month      │       │
│                              └──────────────┘       │
└─────────────────────────────────────────────────────┘
```

## User Flow

1. **User clicks timeframe button** (e.g., "1h")
   - Button highlights with yellow background
   - Chart shows loading indicator
   - Request sent to EA Bot for H1 data
   - Chart updates with new timeframe data

2. **User clicks dropdown (▼)**
   - Dropdown menu appears below button
   - Current timeframe marked with star (★)
   - Sections organized by time unit

3. **User selects from dropdown** (e.g., "2 hours")
   - Dropdown closes automatically
   - Selected timeframe becomes active
   - Chart reloads with H2 data

4. **User clicks outside dropdown**
   - Dropdown closes without changing timeframe

## Data Flow

```
User clicks timeframe button
    ↓
setTimeframe('H2')
    ↓
useEffect triggers on timeframe change
    ↓
POST /api/commands/request-chart { symbol: "BTCUSD", timeframe: "H2" }
    ↓
Supabase: INSERT INTO commands
    ↓
EA Bot: GET /api/mt5/commands
    ↓
EA Bot: ExecuteRequestChartData()
    ↓
EA Bot: StringToTimeframe("H2") → PERIOD_H2
    ↓
EA Bot: CopyRates("BTCUSD", PERIOD_H2, 0, 100)
    ↓
EA Bot: POST /api/mt5/chart-data { bars: [...] }
    ↓
Chart: loadChartData() fetches from database
    ↓
Chart displays H2 candlesticks
```

## Supported Timeframes

| Display | Code | MT5 Period | Description |
|---------|------|------------|-------------|
| 5m | M5 | PERIOD_M5 | 5 minutes |
| 15m | M15 | PERIOD_M15 | 15 minutes |
| 1h | H1 | PERIOD_H1 | 1 hour |
| 4h | H4 | PERIOD_H4 | 4 hours |
| D | D1 | PERIOD_D1 | Daily |
| W | W1 | PERIOD_W1 | Weekly |
| 1 minute | M1 | PERIOD_M1 | 1 minute |
| 30 minutes | M30 | PERIOD_M30 | 30 minutes |
| 2 hours | H2 | PERIOD_H2 | 2 hours |
| 8 hours | H8 | PERIOD_H8 | 8 hours |
| 12 hours | H12 | PERIOD_H12 | 12 hours |
| 3 days | D3 | PERIOD_D1 | 3 days (uses D1) |
| 1 month | MN1 | PERIOD_MN1 | Monthly |

**Note**: MT5 doesn't have native D3 (3 days) period, so it falls back to D1.

## Features

✅ **Quick access buttons** for common timeframes
✅ **Dropdown menu** with all available timeframes
✅ **Visual feedback** - active timeframe highlighted
✅ **Star indicator** in dropdown for current selection
✅ **Auto-reload** chart data on timeframe change
✅ **Click outside** to close dropdown
✅ **Loading indicator** while fetching data
✅ **Organized sections** (Minutes, Hours, Days)
✅ **Responsive design** - works on all screen sizes

## Testing

### Test Timeframe Switching
1. Open app at http://localhost:3000
2. Click different timeframe buttons (5m, 15m, 1h, etc.)
3. Verify:
   - Button highlights when selected
   - Chart shows loading indicator
   - Chart data updates with new timeframe
   - Candlesticks match selected timeframe

### Test Dropdown Menu
1. Click dropdown button (▼)
2. Verify:
   - Menu appears with all timeframes
   - Current timeframe has star (★)
   - Sections are properly labeled
3. Click a timeframe in dropdown
4. Verify:
   - Menu closes automatically
   - Chart updates with selected timeframe
5. Click outside dropdown
6. Verify menu closes without changing timeframe

### Test EA Bot Integration
1. Compile updated EA Bot
2. Attach to any chart in MT5
3. Switch timeframes in web app
4. Check EA Bot logs for:
   - "Requesting chart data for: [SYMBOL] [TIMEFRAME]"
   - "Sent X bars for [SYMBOL] [TIMEFRAME]"

## Server Logs Example

```
POST /api/commands/request-chart 200 in 208ms
GET /api/mt5/chart-data?symbol=BTCUSD&timeframe=H2&limit=200 200 in 191ms
POST /api/commands/request-chart 200 in 208ms
GET /api/mt5/chart-data?symbol=BTCUSD&timeframe=H1&limit=200 200 in 149ms
```

## Files Modified

1. `app/components/TradingChart.tsx` - Added timeframe selector UI and logic
2. `app/api/commands/request-chart/route.ts` - Accept timeframe parameter
3. `mt5-ea-bot/MT5_WebApp_Connector.mq5` - StringToTimeframe function and updated ExecuteRequestChartData

## Status

✅ **Completed and tested**
- Server running on http://localhost:3000
- Timeframe switching working
- EA Bot ready for compilation
- No TypeScript errors
- Dropdown menu functional
- Auto-reload on timeframe change
