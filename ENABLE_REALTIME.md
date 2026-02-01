# 🔴 Bật Realtime trong Supabase

## Vấn đề
Web app không cập nhật realtime khi EA Bot gửi dữ liệu lên. Cần bật Realtime Replication cho các tables.

---

## ✅ Giải pháp: Bật Realtime

### Cách 1: Qua Supabase Dashboard (Khuyến nghị)

1. **Vào Supabase Dashboard:**
   - Truy cập: https://supabase.com/dashboard
   - Đăng nhập và chọn project của bạn

2. **Vào Database → Replication:**
   - Click menu bên trái: **Database**
   - Click tab: **Replication**

3. **Bật Replication cho các tables:**
   
   Tìm và bật toggle "Enable Replication" cho:
   - ✅ `open_positions` (Lệnh đang mở)
   - ✅ `account_history` (Lịch sử tài khoản)
   - ✅ `bot_status` (Trạng thái bot)
   - ✅ `trades` (Lịch sử giao dịch)
   - ✅ `chart_data` (Dữ liệu biểu đồ)
   - ✅ `commands` (Lệnh điều khiển)
   - ✅ `statistics` (Thống kê)

4. **Lưu thay đổi**

---

### Cách 2: Bằng SQL (Nhanh hơn)

1. **Vào SQL Editor:**
   - Click menu bên trái: **SQL Editor**
   - Click **New query**

2. **Chạy SQL này:**

```sql
-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE open_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE account_history;
ALTER PUBLICATION supabase_realtime ADD TABLE bot_status;
ALTER PUBLICATION supabase_realtime ADD TABLE trades;
ALTER PUBLICATION supabase_realtime ADD TABLE chart_data;
ALTER PUBLICATION supabase_realtime ADD TABLE commands;
ALTER PUBLICATION supabase_realtime ADD TABLE statistics;
```

3. **Click "Run"** (hoặc Ctrl+Enter)

4. **Kiểm tra kết quả:**
   - Nếu thành công: "Success. No rows returned"
   - Nếu lỗi "already member": Table đã được bật rồi (OK)

---

## 🧪 Kiểm tra Realtime đã hoạt động

### Test 1: Kiểm tra trong Browser Console

1. Mở web app: `http://localhost:3000`
2. Nhấn F12 để mở DevTools
3. Vào tab **Console**
4. Chạy lệnh:

```javascript
// Kiểm tra channels đang active
console.log('Active channels:', window.supabase?.getChannels?.());
```

Bạn sẽ thấy danh sách channels như:
- `open_positions_changes`
- `account_history_changes`
- `bot_status_changes`
- `trades_changes`

### Test 2: Kiểm tra trong Network Tab

1. Mở DevTools → **Network** tab
2. Filter: **WS** (WebSocket)
3. Bạn sẽ thấy connection tới Supabase Realtime:
   - URL: `wss://rkqwppokwrgushngugpv.supabase.co/realtime/v1/websocket`
   - Status: **101 Switching Protocols** (OK)

### Test 3: Test thực tế

1. **Mở lệnh từ MT5** hoặc gửi lệnh từ web app
2. **Đợi 5 giây** (UPDATE_INTERVAL)
3. **Positions sẽ tự động hiện** trên web app (không cần refresh)

Nếu không tự động, nhấn nút **Refresh** trong "Lệnh Đang Mở"

---

## 🔧 Troubleshooting

### Vấn đề 1: Realtime không hoạt động sau khi bật

**Giải pháp:**
1. Hard refresh web app: **Ctrl+Shift+R** (Windows) hoặc **Cmd+Shift+R** (Mac)
2. Xóa cache browser
3. Restart dev server: `pnpm dev`

### Vấn đề 2: "Subscription error" trong console

**Nguyên nhân:** RLS policies chặn realtime subscriptions

**Giải pháp:** Chạy SQL này để cho phép anonymous subscriptions:

```sql
-- Allow anonymous users to subscribe to changes
ALTER TABLE open_positions REPLICA IDENTITY FULL;
ALTER TABLE account_history REPLICA IDENTITY FULL;
ALTER TABLE bot_status REPLICA IDENTITY FULL;
ALTER TABLE trades REPLICA IDENTITY FULL;
ALTER TABLE chart_data REPLICA IDENTITY FULL;
ALTER TABLE commands REPLICA IDENTITY FULL;
```

### Vấn đề 3: WebSocket connection failed

**Kiểm tra:**
1. Supabase project có đang active không?
2. `.env.local` có đúng credentials không?
3. Network có block WebSocket không? (firewall, proxy)

**Giải pháp tạm thời:** Dùng nút **Refresh** để load data manually

---

## 📊 Cách hoạt động của Realtime

```
MT5 EA Bot
    ↓ POST /api/mt5/positions
Supabase Database (INSERT/UPDATE)
    ↓ Trigger postgres_changes event
Supabase Realtime Server
    ↓ WebSocket broadcast
Web App (React Component)
    ↓ Update UI
User sees changes immediately
```

---

## 🎯 Kết quả mong đợi

Sau khi bật Realtime:

✅ **Lệnh đang mở** tự động hiện khi EA Bot gửi
✅ **Account info** tự động cập nhật mỗi 5 giây
✅ **Bot status** hiện "Đang chạy" realtime
✅ **Trade history** tự động thêm lệnh mới
✅ **Chart data** tự động update khi có bar mới

---

## 💡 Tips

1. **Realtime có độ trễ ~100-500ms** - Bình thường
2. **Nếu cần instant update** - Dùng nút Refresh
3. **Realtime tốn bandwidth** - Chỉ bật cho tables cần thiết
4. **Free tier có giới hạn** - 200 concurrent connections

---

## 🚀 Next Steps

Sau khi bật Realtime:

1. ✅ Test mở lệnh từ web app
2. ✅ Kiểm tra positions hiện realtime
3. ✅ Test đóng lệnh
4. ✅ Kiểm tra account info update
5. ✅ Test chart data realtime

Good luck! 🎉
