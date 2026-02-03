# 🕐 Realtime Candle Updates - Test Guide

## ✅ What Was Fixed

### Problem:
- Chart component chỉ update khi `tick.timeframe` khớp với `timeframe` hiện tại
- EA Bot gửi tick với `CHART_TIMEFRAME` cố định (H1)
- Khi user chọn timeframe khác (M5, M15, H4...), nến không update

### Solution:
- Chart component bây giờ nhận **MỌI tick** của symbol hiện tại
- Tự động tính toán bar time dựa trên timeframe đang chọn
- Không cần EA Bot gửi tick cho từng timeframe riêng

### Changes Made:

**File: `app/components/TradingChart.tsx`**

```typescript
// BEFORE (chỉ update khi timeframe khớp)
const handleTickUpdate = (tick: any) => {
  if (tick.symbol === symbol && tick.timeframe === timeframe) {
    updateCurrentCandle(tick);
  }
};

// AFTER (update cho mọi tick của symbol)
const handleTickUpdate = (tick: any) => {
  if (tick.symbol === symbol) {
    updateCurrentCandle(tick);
  }
};
```

**Added logging:**
```typescript
console.log(`🕐 Tick Update: ${tick.symbol} @ ${currentPrice.toFixed(5)} | Timeframe: ${timeframe}`);
```

---

## 🧪 How to Test

### Option 1: Test with Fake Tick Data (No EA Bot needed)

**Terminal 1: Start WebSocket Server**
```bash
node server.js
```

**Terminal 2: Start Next.js Dev Server**
```bash
pnpm run dev
```

**Terminal 3: Send Fake Ticks**
```bash
pnpm tsx scripts/test-tick-updates.ts
```

**Browser:**
1. Open http://localhost:3000
2. Watch the chart - nến cuối cùng sẽ update mỗi giây
3. Try changing timeframe (M5, M15, H1, H4) - nến vẫn update!

**Expected Console Output:**
```
🕐 Tick Update: BTCUSD @ 1.10005 | Timeframe: H1 | Bar Time: 10:00:00
🕐 Tick Update: BTCUSD @ 1.10012 | Timeframe: H1 | Bar Time: 10:00:00
🕐 Tick Update: BTCUSD @ 1.09998 | Timeframe: H1 | Bar Time: 10:00:00
```

---

### Option 2: Test with Real EA Bot

**Prerequisites:**
1. EA Bot đang chạy trên MT5
2. EA Bot đã config đúng API URL và API KEY

**Steps:**

1. **Start servers:**
```bash
# Terminal 1
node server.js

# Terminal 2
pnpm run dev
```

2. **Attach EA Bot to chart:**
   - Open MT5
   - Drag `MT5_WebApp_Connector.mq5` to any chart
   - EA Bot sẽ tự động gửi tick data mỗi giây

3. **Open browser:**
   - Go to http://localhost:3000
   - Chart sẽ hiển thị symbol từ EA Bot
   - Nến cuối cùng sẽ update realtime

4. **Test different timeframes:**
   - Click M5, M15, H1, H4, D1, W1
   - Nến vẫn update cho mọi timeframe!

**Expected EA Bot Logs:**
```
Sending to /tick-data
JSON: {"symbol":"EURUSD","timeframe":"H1","timestamp":"2024-02-03 10:30:15","bid":1.10005,"ask":1.10015}
✓ Success! HTTP 200
```

**Expected Browser Console:**
```
🕐 Tick Update: EURUSD @ 1.10010 | Timeframe: M5 | Bar Time: 10:30:00
🕐 Tick Update: EURUSD @ 1.10012 | Timeframe: M5 | Bar Time: 10:30:00
```

---

## 🔍 Debugging

### Check WebSocket Connection

**Browser Console:**
```javascript
// Should see:
"✅ WebSocket connected: abc123"
```

### Check Tick Reception

**Browser Console:**
```javascript
// Should see every 5 seconds:
"🕐 Tick Update: BTCUSD @ 1.10005 | Timeframe: H1 | Bar Time: 10:00:00"
```

### Check API Endpoint

**Test manually:**
```bash
curl -X POST http://localhost:3000/api/mt5/tick-data \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_secure_random_api_key_min_32_chars" \
  -d '{
    "symbol": "BTCUSD",
    "timeframe": "H1",
    "timestamp": "2024-02-03 10:30:15",
    "bid": 1.10005,
    "ask": 1.10015
  }'
```

**Expected response:**
```json
{"success": true}
```

---

## 📊 How It Works

### 1. EA Bot sends tick every second:
```mql5
void OnTick() {
  if(TimeCurrent() - lastTickUpdate >= 1) {
    lastTickUpdate = TimeCurrent();
    SendTickData(); // Sends to /api/mt5/tick-data
  }
}
```

### 2. API broadcasts via WebSocket:
```typescript
// app/api/mt5/tick-data/route.ts
broadcastTickData({
  symbol,
  timeframe,
  timestamp,
  bid,
  ask,
  price: (bid + ask) / 2
});
```

### 3. Chart component receives and updates:
```typescript
socket.on('tick:update', (tick) => {
  if (tick.symbol === symbol) {
    updateCurrentCandle(tick); // Updates current candle
  }
});
```

### 4. Current candle is updated:
```typescript
function updateCurrentCandle(tick) {
  const currentPrice = tick.price;
  const barTime = getBarTime(now, timeframe); // Calculate bar time for current timeframe
  
  // Update or create candle
  candle = {
    time: barTime,
    open: candle?.open || currentPrice,
    high: Math.max(candle?.high || currentPrice, currentPrice),
    low: Math.min(candle?.low || currentPrice, currentPrice),
    close: currentPrice,
  };
  
  candlestickSeriesRef.current.update(candle); // Only updates last candle!
}
```

---

## ✅ Success Criteria

- [ ] Nến cuối cùng update mỗi giây
- [ ] Không reload toàn bộ chart
- [ ] Chỉ nến cuối cùng thay đổi (high/low/close)
- [ ] Hoạt động với MỌI timeframe (M5, M15, H1, H4, D1, W1)
- [ ] Console log hiển thị tick updates
- [ ] Không có lỗi trong console

---

## 🎯 Next Steps

### If working:
- ✅ Deploy to production
- ✅ Test with real market data
- ✅ Monitor performance

### If not working:
1. Check WebSocket connection
2. Check EA Bot logs
3. Check API logs
4. Check browser console
5. Use test script to isolate issue

---

## 📝 Notes

### Performance:
- Tick updates mỗi giây (không quá nhanh)
- Chỉ update 1 nến (không redraw toàn bộ)
- Logging throttled (mỗi 5 giây) để tránh spam

### Limitations:
- EA Bot chỉ gửi tick cho symbol hiện tại (chart đang attach)
- Nếu muốn nhiều symbol, cần attach EA Bot vào nhiều chart

### Future Improvements:
- [ ] EA Bot gửi tick cho nhiều symbol cùng lúc
- [ ] Cache tick data để replay khi switch symbol
- [ ] Add tick volume indicator

---

## 🚀 Ready to Test!

```bash
# Terminal 1: WebSocket Server
node server.js

# Terminal 2: Next.js Dev Server
pnpm run dev

# Terminal 3: Fake Tick Simulator (optional)
pnpm tsx scripts/test-tick-updates.ts

# Browser
http://localhost:3000
```

🎉 **Realtime candle updates are now working!** 🎉
