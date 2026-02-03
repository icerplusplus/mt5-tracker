# Kết nối Dev (localhost) tới WebSocket Server trên VPS

## 🎯 Mục tiêu

Chạy web app ở local (`localhost:3000`) và kết nối tới WebSocket server trên VPS để test realtime features.

## ✅ Đã sửa

1. **WebSocket Client** (`lib/websocket/client.ts`) - Kết nối tới VPS thay vì Next.js route
2. **Logging** (`websocket-server/server.js`) - Hiển thị chi tiết ai đang kết nối

## 🚀 Cách sử dụng

### Bước 1: Cấu hình VPS (chỉ làm 1 lần)

**Trên VPS Windows:**

```powershell
# Di chuyển vào thư mục websocket-server
cd path\to\websocket-server

# Sửa file .env
notepad .env

# Thêm localhost:3000 vào ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app

# Lưu file
```

Hoặc dùng script tự động:
```powershell
.\update-cors.ps1
```

### Bước 2: Chạy WebSocket Server trên VPS

```powershell
# Cách đơn giản nhất
node server.js
```

Bạn sẽ thấy:
```
████████████████████████████████████████████████████████████████████████████████
█                                                                              █
█  🚀 MT5 WebSocket Server Started Successfully!                              █
█                                                                              █
████████████████████████████████████████████████████████████████████████████████

📍 Server Information:
   HTTP Endpoint: http://0.0.0.0:3001
   WebSocket Endpoint: ws://0.0.0.0:3001
   Health Check: http://0.0.0.0:3001/health

🌐 Allowed Origins:
   - http://localhost:3000
   - https://your-vercel-app.vercel.app

⏳ Waiting for connections...
```

### Bước 3: Chạy Web App ở Local

**Trên máy local:**

```bash
pnpm dev
```

Web app sẽ chạy tại `http://localhost:3000`

### Bước 4: Kiểm tra kết nối

**Trên browser (F12 Console):**
```
🔌 Connecting to WebSocket server: ws://103.179.172.89:3001
✅ WebSocket connected: abc123xyz
📍 Connected to: ws://103.179.172.89:3001
```

**Trên VPS (terminal logs):**
```
================================================================================
✅ NEW CONNECTION
   Client ID: abc123xyz
   IP Address: YOUR_LOCAL_IP
   Origin: http://localhost:3000
   User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
   Time: 03/02/2026, 14:30:45
   Total Active Connections: 1
================================================================================
```

## 📊 Logs bạn sẽ thấy trên VPS

### Khi có client kết nối:
```
================================================================================
✅ NEW CONNECTION
   Client ID: abc123xyz
   IP Address: 192.168.1.100
   Origin: http://localhost:3000
   User Agent: Mozilla/5.0...
   Time: 03/02/2026, 14:30:45
   Total Active Connections: 1
================================================================================
```

### Khi broadcast data:
```
📡 [POSITIONS] Broadcasted 5 positions to 1 clients
📡 [ACCOUNT] Broadcasted account info to 1 clients
   Balance: $10000.00 | Equity: $10250.50 | Profit: $250.50
📡 [BOT STATUS] 🟢 RUNNING | Account: 12345678 | Broadcasted to 1 clients
📡 [CHART] BTCUSD H1 | Close: 45000.50 | Broadcasted to 1 clients
```

### Khi client ngắt kết nối:
```
────────────────────────────────────────────────────────────────────────────────
❌ CLIENT DISCONNECTED
   Client ID: abc123xyz
   IP Address: 192.168.1.100
   Reason: transport close
   Duration: 125s (2m 5s)
   Remaining Connections: 0
────────────────────────────────────────────────────────────────────────────────
```

### Summary mỗi 60 giây:
```
────────────────────────────────────────────────────────────────────────────────
📊 ACTIVE CONNECTIONS SUMMARY (14:35:45)
   Total Connections: 2
────────────────────────────────────────────────────────────────────────────────
   [abc123...] 192.168.1.100
      Origin: http://localhost:3000
      Connected: 5m 30s ago
      Last Activity: 2s ago
      Subscriptions: positions, account
   [xyz789...] 103.179.172.89
      Origin: https://your-app.vercel.app
      Connected: 15m 45s ago
      Last Activity: 1s ago
      Subscriptions: positions, account, chart
────────────────────────────────────────────────────────────────────────────────
```

## ⚠️ Troubleshooting

### Lỗi: CORS blocked

**Triệu chứng:** Browser console hiển thị CORS error

**Giải pháp:**
```powershell
# Trên VPS
cd websocket-server
.\update-cors.ps1
# Restart server (Ctrl+C rồi chạy lại)
node server.js
```

### Lỗi: Connection timeout

**Triệu chứng:** Browser console hiển thị "Connection timeout"

**Kiểm tra:**
1. WebSocket server có đang chạy không?
   ```powershell
   # Trên VPS
   netstat -an | findstr 3001
   ```

2. Firewall có mở port 3001 không?
   ```powershell
   # Trên VPS
   New-NetFirewallRule -DisplayName "WebSocket Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   ```

3. Health check có hoạt động không?
   ```bash
   # Từ máy local
   curl http://103.179.172.89:3001/health
   ```

### Lỗi: Cannot connect

**Kiểm tra `.env.local` trên máy local:**
```env
NEXT_PUBLIC_WS_URL=ws://103.179.172.89:3001
```

**Kiểm tra IP VPS:**
- Đảm bảo IP `103.179.172.89` đúng
- Ping để kiểm tra: `ping 103.179.172.89`

## 🎯 Tóm tắt

### Trên VPS (1 lần):
1. Sửa `.env` → Thêm `http://localhost:3000` vào `ALLOWED_ORIGINS`
2. Chạy `node server.js`
3. Để terminal mở

### Trên Local (mỗi lần dev):
1. Chạy `pnpm dev`
2. Mở `http://localhost:3000`
3. Kiểm tra console (F12) xem có kết nối không

### Dừng:
- **VPS:** Nhấn `Ctrl+C` trong terminal
- **Local:** Nhấn `Ctrl+C` trong terminal

## 📚 Tài liệu thêm

- **[DEV_WEBSOCKET_SETUP.md](./DEV_WEBSOCKET_SETUP.md)** - Hướng dẫn chi tiết
- **[websocket-server/QUICKSTART.md](./websocket-server/QUICKSTART.md)** - Quick start cho VPS
- **[websocket-server/README.md](./websocket-server/README.md)** - Tài liệu đầy đủ

## ✨ Lợi ích

- ✅ Test realtime features trên local
- ✅ Debug dễ dàng với logs chi tiết
- ✅ Không cần deploy để test
- ✅ Giống production environment
- ✅ Hot reload vẫn hoạt động

Chúc bạn code vui vẻ! 🚀
