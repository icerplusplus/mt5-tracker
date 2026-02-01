# ⚡ WebSocket Realtime - Quick Start

## 🎯 Đã làm gì?

Chuyển từ **Auto-refresh (polling mỗi 1 giây)** sang **WebSocket (push realtime)**

### Before (Polling)
```
Web App → API (mỗi 1 giây)
❌ 60 requests/phút
❌ Delay 1 giây
❌ Tốn bandwidth
```

### After (WebSocket)
```
EA Bot → API → WebSocket → Web App (instant)
✅ 0 polling requests
✅ Instant update (~10-50ms)
✅ Tiết kiệm bandwidth
```

---

## 🚀 Cách chạy

### 1. Dừng server cũ
```bash
Ctrl+C
```

### 2. Chạy server mới
```bash
pnpm dev
```

Bạn sẽ thấy:
```
✅ Server ready on http://localhost:3000
✅ Socket.IO ready on ws://localhost:3000
```

### 3. Mở web app
```
http://localhost:3000
```

### 4. Kiểm tra connection
Trong "Lệnh Đang Mở", bạn sẽ thấy:
- 🟢 **Live** = WebSocket connected ✅
- 🔴 **Offline** = Disconnected ❌

---

## ✅ Test Realtime

1. **Mở lệnh** từ web app
2. **Positions hiện ngay lập tức** (không cần đợi)
3. **Current price update realtime** khi EA Bot gửi
4. **Profit/Loss thay đổi instant**

---

## 🔍 Debug

### Browser Console (F12)
```
✅ WebSocket connected: abc123xyz
📊 Received positions via WebSocket: 2
```

### Server Terminal
```
🔌 Client connected: abc123xyz
📊 Received positions update: 2 positions
✅ Saved 2 positions to database
📡 Broadcasted 2 positions to 1 clients
```

---

## 🐛 Nếu có lỗi

### "WebSocket connection failed"
```bash
# Restart server
pnpm dev
```

### Status hiện "Offline"
```bash
# Hard refresh
Ctrl+Shift+R
```

### Positions không update
```bash
# Check EA Bot logs trong MT5
# Phải thấy: "✓ Success! HTTP 200"
```

---

## 📦 Files đã thêm

```
server.js                      # Custom server với Socket.IO
lib/websocket/
  ├── server.ts               # Broadcast functions
  └── client.ts               # WebSocket client
app/components/
  └── OpenPositions.tsx       # Updated với WebSocket
WEBSOCKET_SETUP.md            # Full documentation
```

---

## 🎉 Kết quả

- ✅ Realtime instant (không delay)
- ✅ Tiết kiệm 60 requests/phút
- ✅ Connection status indicator
- ✅ Auto-reconnect
- ✅ Smooth animations
- ✅ Production ready

Done! 🚀
