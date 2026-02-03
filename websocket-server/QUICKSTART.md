# WebSocket Server - Quick Start Guide

## 🚀 Chạy server trên VPS (Windows)

### Lần đầu tiên

1. **Cài đặt Node.js** (nếu chưa có)
   ```powershell
   # Kiểm tra Node.js
   node --version
   npm --version
   ```

2. **Cấu hình .env**
   ```powershell
   cd websocket-server
   
   # Copy file mẫu
   copy .env.example .env
   
   # Sửa file .env
   notepad .env
   ```
   
   Cập nhật các giá trị:
   ```env
   PORT=3001
   HOST=0.0.0.0
   ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
   SUPABASE_URL=https://rkqwppokwrgushngugpv.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   MT5_API_KEY=your_secure_random_api_key_min_32_chars
   ```

3. **Cài đặt dependencies**
   ```powershell
   npm install
   ```

4. **Mở firewall cho port 3001**
   ```powershell
   New-NetFirewallRule -DisplayName "WebSocket Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   ```

### Chạy server

**Cách 1: Chạy trực tiếp (khuyến nghị cho dev)**
```powershell
cd websocket-server
node server.js
```

Hoặc dùng script:
```powershell
.\start-server.ps1
```

**Cách 2: Chạy background (không khuyến nghị - khó debug)**
```powershell
Start-Process -NoNewWindow node -ArgumentList 'server.js'
```

### Dừng server

- Nếu chạy trực tiếp: Nhấn `Ctrl+C`
- Nếu chạy background:
  ```powershell
  # Tìm process
  Get-Process node
  
  # Dừng process (thay <PID> bằng số PID)
  Stop-Process -Id <PID>
  ```

## 🔍 Kiểm tra server

### Health Check
```powershell
# Từ VPS
curl http://localhost:3001/health

# Từ máy khác
curl http://103.179.172.89:3001/health
```

Kết quả mong đợi:
```json
{
  "status": "ok",
  "service": "MT5 WebSocket Server",
  "uptime": 123.45,
  "connections": 0,
  "timestamp": "2026-02-03T07:30:45.123Z"
}
```

### Kiểm tra port
```powershell
netstat -an | findstr 3001
```

Kết quả mong đợi:
```
TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING
```

## 📊 Xem logs

Server sẽ hiển thị logs trực tiếp trong console:

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

📊 Server Status:
   Node Version: v20.x.x
   Platform: win32
   PID: 12345
   Started: 03/02/2026, 14:30:45

████████████████████████████████████████████████████████████████████████████████

⏳ Waiting for connections...
```

Khi có client kết nối:
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

## 🔄 Cập nhật ALLOWED_ORIGINS

Nếu cần thêm origin mới (ví dụ: localhost:3000 cho dev):

```powershell
# Dùng script tự động
.\update-cors.ps1

# Hoặc sửa thủ công
notepad .env

# Thêm origin mới
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app,https://new-domain.com

# Restart server (Ctrl+C rồi chạy lại)
node server.js
```

## ⚠️ Troubleshooting

### Server không khởi động

1. **Kiểm tra port đã được sử dụng chưa**
   ```powershell
   netstat -an | findstr 3001
   ```
   
   Nếu port đã được dùng, dừng process cũ:
   ```powershell
   Get-Process node | Stop-Process
   ```

2. **Kiểm tra .env file**
   ```powershell
   type .env
   ```
   
   Đảm bảo tất cả biến môi trường đã được cấu hình.

3. **Kiểm tra dependencies**
   ```powershell
   npm install
   ```

### Client không kết nối được

1. **Kiểm tra firewall**
   ```powershell
   Get-NetFirewallRule -DisplayName "WebSocket Server"
   ```
   
   Nếu không có rule, tạo mới:
   ```powershell
   New-NetFirewallRule -DisplayName "WebSocket Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   ```

2. **Kiểm tra ALLOWED_ORIGINS**
   
   Đảm bảo origin của client có trong danh sách:
   ```env
   ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
   ```

3. **Test kết nối từ client**
   
   Mở browser console (F12) và chạy:
   ```javascript
   const socket = io('ws://103.179.172.89:3001');
   socket.on('connect', () => console.log('Connected!'));
   socket.on('connect_error', (err) => console.error('Error:', err));
   ```

## 💡 Tips

1. **Chạy trong screen/tmux** (nếu muốn server chạy sau khi đóng SSH)
   ```powershell
   # Cài đặt screen (nếu có WSL)
   wsl
   screen -S websocket
   cd /mnt/c/path/to/websocket-server
   node server.js
   
   # Detach: Ctrl+A, D
   # Reattach: screen -r websocket
   ```

2. **Xem logs realtime**
   
   Server logs sẽ hiển thị trực tiếp trong console. Để lưu logs:
   ```powershell
   node server.js > logs.txt 2>&1
   ```

3. **Auto-restart khi crash**
   
   Nếu muốn server tự động restart khi crash, dùng PM2:
   ```powershell
   npm install -g pm2
   pm2 start server.js --name mt5-websocket
   pm2 logs mt5-websocket
   ```

## 🎯 Kết luận

Bây giờ bạn có thể:
- ✅ Chạy WebSocket server trên VPS
- ✅ Xem logs realtime
- ✅ Kết nối từ localhost:3000 (dev) và Vercel (production)
- ✅ Debug và troubleshoot khi có vấn đề

Chỉ cần chạy `node server.js` và để terminal mở!
