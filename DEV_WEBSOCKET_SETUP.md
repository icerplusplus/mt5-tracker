# Kết nối WebSocket từ Dev (localhost) tới VPS

## ✅ Đã sửa

Tôi đã cập nhật `lib/websocket/client.ts` để kết nối tới VPS server thay vì Next.js route.

## 📋 Cấu hình cần thiết

### 1. Trên VPS (WebSocket Server)

Cập nhật file `.env` trong thư mục `websocket-server/`:

```env
PORT=3001
HOST=0.0.0.0

# QUAN TRỌNG: Thêm localhost:3000 vào ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app

SUPABASE_URL=https://rkqwppokwrgushngugpv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MT5_API_KEY=your_secure_random_api_key_min_32_chars
```

**Lưu ý:** Phải thêm `http://localhost:3000` vào `ALLOWED_ORIGINS` để CORS cho phép kết nối từ dev environment.

### 2. Trên Local Machine (Web App)

File `.env.local` đã có sẵn:

```env
# WebSocket URL trỏ tới VPS
NEXT_PUBLIC_WS_URL=ws://103.179.172.89:3001
```

## 🚀 Cách chạy

### Bước 1: Cập nhật ALLOWED_ORIGINS trên VPS

**Cách 1: Tự động (khuyến nghị)**

```powershell
# SSH vào VPS
ssh user@103.179.172.89

# Di chuyển vào thư mục websocket-server
cd path/to/websocket-server

# Chạy script tự động
.\update-cors.ps1

# Sau đó restart server (Ctrl+C để dừng server cũ, rồi chạy lại)
node server.js
```

**Cách 2: Thủ công**

```powershell
# Mở file .env
notepad .env
# hoặc
code .env

# Thêm localhost:3000 vào ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app

# Lưu file và restart server
# Nhấn Ctrl+C để dừng server đang chạy
# Chạy lại:
node server.js
```

### Bước 2: Chạy Web App ở Local

```bash
# Trên máy local
pnpm dev
```

### Bước 3: Kiểm tra kết nối

Mở browser console (F12), bạn sẽ thấy:

```
🔌 Connecting to WebSocket server: ws://103.179.172.89:3001
✅ WebSocket connected: abc123xyz
📍 Connected to: ws://103.179.172.89:3001
```

## 🔍 Kiểm tra trên VPS

Khi web app kết nối, trên VPS logs sẽ hiển thị:

```
================================================================================
✅ NEW CONNECTION
   Client ID: abc123xyz
   IP Address: YOUR_LOCAL_IP
   Origin: http://localhost:3000
   User Agent: Mozilla/5.0...
   Time: 03/02/2026, 14:30:45
   Total Active Connections: 1
================================================================================
```

## ⚠️ Troubleshooting

### Lỗi: CORS blocked

**Nguyên nhân:** `ALLOWED_ORIGINS` trên VPS chưa có `http://localhost:3000`

**Giải pháp:**
```powershell
# Trên VPS
cd websocket-server

# Cách 1: Dùng script
.\update-cors.ps1

# Cách 2: Sửa thủ công
notepad .env  # hoặc code .env

# Thêm localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app

# Restart server (Ctrl+C rồi chạy lại)
node server.js
```

### Lỗi: Connection timeout

**Nguyên nhân:** Firewall chặn port 3001

**Giải pháp:**
```powershell
# Trên VPS Windows
New-NetFirewallRule -DisplayName "WebSocket Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### Lỗi: Cannot connect to ws://103.179.172.89:3001

**Kiểm tra:**
1. WebSocket server có đang chạy không?
   ```powershell
   # Kiểm tra process
   Get-Process node
   
   # Hoặc kiểm tra port
   netstat -an | findstr 3001
   ```

2. Health check có hoạt động không?
   ```powershell
   # Từ VPS
   curl http://localhost:3001/health
   
   # Từ máy local
   curl http://103.179.172.89:3001/health
   ```

3. Nếu server không chạy, khởi động lại:
   ```powershell
   cd websocket-server
   node server.js
   ```

## 📊 Luồng hoạt động

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│  Local Dev      │ ◄─────────────────────────► │  VPS Server     │
│  localhost:3000 │  ws://103.179.172.89:3001  │  103.179.172.89 │
└─────────────────┘                             └─────────────────┘
        │                                               │
        │                                               │
        ▼                                               ▼
  Browser Console                              WebSocket Logs
  - Connection status                          - Client connections
  - Realtime updates                           - Broadcast events
  - Error messages                             - Active sessions
```

## ✨ Lợi ích

1. **Test realtime trên local** - Không cần deploy để test WebSocket
2. **Debug dễ dàng** - Xem logs trên cả client và server
3. **Giống production** - Sử dụng cùng VPS server như production
4. **Hot reload** - Next.js dev mode vẫn hoạt động bình thường

## 🎯 Kết luận

Bây giờ bạn có thể:
- ✅ Chạy `pnpm dev` trên local
- ✅ Kết nối tới WebSocket server trên VPS
- ✅ Nhận realtime updates từ EA Bot
- ✅ Debug và test như production

Chỉ cần đảm bảo:
1. WebSocket server đang chạy trên VPS
2. `ALLOWED_ORIGINS` có `http://localhost:3000`
3. Firewall cho phép port 3001
