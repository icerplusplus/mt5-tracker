# Realtime Candle Updates - Quick Start

## ✅ Implementation Complete

Nến giờ đã chạy realtime theo giá thị trường!

## Cách Hoạt Động

1. **EA Bot** gửi giá bid/ask mỗi giây
2. **Web App** nhận và tính giá mid: `(bid + ask) / 2`
3. **Chart** cập nhật nến hiện tại với giá mới
4. **OHLC** được duy trì chính xác:
   - Open: Giá mở của nến
   - High: Giá cao nhất (tự động tăng nếu giá mới cao hơn)
   - Low: Giá thấp nhất (tự động giảm nếu giá mới thấp hơn)
   - Close: Giá hiện tại (cập nhật liên tục)

## Cài Đặt

### 1. Recompile EA Bot
```
1. Mở MT5
2. Mở MetaEditor (F4)
3. Mở file: mt5-ea-bot/MT5_WebApp_Connector.mq5
4. Click Compile (F7)
5. Đảm bảo không có lỗi
6. Restart EA Bot trên chart
```

### 2. Restart Web App
```bash
# Stop current server (Ctrl+C)
# Start again
pnpm dev
```

## Kiểm Tra

1. Mở web app
2. Chọn symbol (ví dụ: BTCUSD)
3. Quan sát nến hiện tại (nến cuối cùng)
4. Nến sẽ cập nhật mỗi giây theo giá thị trường
5. High/Low sẽ tự động mở rộng khi giá di chuyển
6. Close sẽ luôn là giá hiện tại

## Tần Suất Cập Nhật

| Loại Dữ Liệu | Tần Suất | Mục Đích |
|---------------|----------|----------|
| Tick Data | 1 giây | Cập nhật nến realtime |
| Chart Bars | 5 giây | Dữ liệu nến đầy đủ với volume |
| Account Info | 1 giây | Balance, equity, margin |
| Positions | 1 giây | Vị thế đang mở |

## Lợi Ích

✅ Nến di chuyển mượt mà theo giá thị trường  
✅ OHLC chính xác  
✅ Độ trễ thấp (~50ms qua WebSocket)  
✅ Hiệu quả (throttled 1 tick/giây)  
✅ Hoạt động trên tất cả timeframe (M1, M5, H1, D1, ...)

## Files Đã Thay Đổi

1. `mt5-ea-bot/MT5_WebApp_Connector.mq5` - Thêm SendTickData()
2. `app/api/mt5/tick-data/route.ts` - API endpoint mới
3. `lib/websocket/server.ts` - Thêm broadcastTickData()
4. `app/components/TradingChart.tsx` - Thêm tick update handler

## Troubleshooting

### Nến không cập nhật?
1. Kiểm tra EA Bot đang chạy
2. Kiểm tra Console log: `F12 → Console`
3. Tìm message: `tick:update`
4. Kiểm tra WebSocket connected

### Giá không chính xác?
1. Giá là mid price: `(bid + ask) / 2`
2. Đây là giá chuẩn cho chart
3. Nếu muốn bid/ask riêng, có thể thêm sau

### Performance issue?
1. Tick updates đã throttled 1/giây
2. Nếu vẫn chậm, có thể tăng lên 2-3 giây
3. Sửa trong EA Bot: `if(TimeCurrent() - lastTickUpdate >= 2)`

## Next Steps

Có thể thêm:
- [ ] Tick volume cho nến hiện tại
- [ ] Hiển thị bid/ask spread
- [ ] Tick chart mode (mỗi tick là 1 nến)
- [ ] Order book visualization
- [ ] Depth of market data
