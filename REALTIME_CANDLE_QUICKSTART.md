# ⚡ Realtime Candle Updates - Quick Start

## 🎯 What's Fixed

Nến bây giờ được cập nhật **realtime** mỗi giây, không reload toàn bộ chart!

## 🚀 Test Ngay (3 bước)

### 1. Start servers:
```bash
# Terminal 1: WebSocket Server
node server.js

# Terminal 2: Next.js Dev Server  
pnpm run dev
```

### 2. Send fake ticks (không cần EA Bot):
```bash
# Terminal 3: Tick Simulator
pnpm tsx scripts/test-tick-updates.ts
```

### 3. Open browser:
```
http://localhost:3000
```

## ✅ Expected Result

- Nến cuối cùng update mỗi giây
- High/Low/Close thay đổi theo tick
- Console log: `🕐 Tick Update: BTCUSD @ 1.10005`
- Không reload toàn bộ chart
- Hoạt động với MỌI timeframe (M5, M15, H1, H4...)

## 🔧 Changes Made

**File: `app/components/TradingChart.tsx`**

1. **Removed timeframe check** - Chart nhận mọi tick của symbol:
```typescript
// BEFORE
if (tick.symbol === symbol && tick.timeframe === timeframe)

// AFTER  
if (tick.symbol === symbol)
```

2. **Added logging** - Debug tick updates:
```typescript
console.log(`🕐 Tick Update: ${tick.symbol} @ ${currentPrice.toFixed(5)}`);
```

## 📊 How It Works

```
EA Bot (mỗi giây)
    ↓
/api/mt5/tick-data
    ↓
WebSocket broadcast
    ↓
Chart component
    ↓
Update nến cuối cùng (chỉ 1 nến!)
```

## 🐛 Troubleshooting

**Nến không update?**
1. Check console: `✅ WebSocket connected`
2. Check console: `🕐 Tick Update: ...`
3. Check EA Bot logs: `✓ Success! HTTP 200`

**Không thấy log?**
- Refresh browser (F5)
- Check WebSocket server đang chạy
- Check API_KEY trong `.env.local`

## 📝 Files Changed

- ✅ `app/components/TradingChart.tsx` - Fixed tick handling
- ✅ `scripts/test-tick-updates.ts` - Test tool
- ✅ `REALTIME_CANDLE_TEST.md` - Full documentation

## 🎉 Done!

Realtime candle updates đã hoạt động! Test ngay với fake ticks hoặc EA Bot thật.
