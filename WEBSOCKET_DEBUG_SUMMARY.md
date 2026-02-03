# WebSocket Debug - Tóm tắt nhanh

## ✅ Đã thêm

### 1. **Chi tiết Console Logs** 
File: `lib/websocket/client.ts`

Logs hiển thị:
- Environment info (NODE_ENV, Vercel env, URL)
- Connection details (Socket ID, Transport, Timestamp)
- Error messages với troubleshooting
- Reconnection tracking

### 2. **WebSocket Debug UI**
File: `app/components/WebSocketDebug.tsx`

Features:
- Floating button góc dưới phải (⚡)
- Real-time connection status
- Environment & Vercel info
- Troubleshooting tips
- Màu: 🟢 Connected | 🔴 Disconnected | 🟡 Reconnecting

### 3. **Test Script**
File: `scripts/test-websocket-connection.ts`

Chạy: `pnpm test:ws-connection`

## 🚀 Cách sử dụng

### Test từ Local

```bash
# Test WebSocket connection
pnpm test:ws-connection

# Chạy dev
pnpm dev
```

### Check trên Vercel Production

1. **Mở app:** `https://your-app.vercel.app`

2. **Mở Console (F12)**

3. **Xem logs:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔌 WebSocket Client Initialization
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📍 Environment Info:
      NODE_ENV: production
      Is Vercel: true
      Vercel Environment: production
      Vercel URL: your-app.vercel.app
   
   ✅ WebSocket Connected Successfully!
   ```

4. **Hoặc dùng Debug UI:**
   - Click nút ⚡ góc dưới phải
   - Xem connection info

### Check trên VPS

Logs sẽ hiển thị:
```
================================================================================
✅ NEW CONNECTION
   Client ID: abc123xyz
   IP Address: 76.76.21.21 (Vercel IP)
   Origin: https://your-app.vercel.app
   User Agent: Mozilla/5.0...
   Time: 03/02/2026, 14:30:45
   Total Active Connections: 1
================================================================================
```

## 🔧 Cấu hình Vercel

### Environment Variables

Vercel Dashboard → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_WS_URL` | `ws://103.179.172.89:3001` |

**Sau khi thêm → Redeploy!**

### ALLOWED_ORIGINS trên VPS

File: `websocket-server/.env`

```env
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app,https://your-app-*.vercel.app
```

**Sau khi sửa → Restart server!**

## 📊 Logs bạn sẽ thấy

### ✅ Khi thành công

**Browser Console:**
```
✅ WebSocket Connected Successfully!
   Socket ID: abc123xyz
   Transport: websocket
   Environment: Vercel (production)
   Client Origin: https://your-app.vercel.app
```

**VPS Logs:**
```
✅ NEW CONNECTION
   IP Address: 76.76.21.21
   Origin: https://your-app.vercel.app
```

### ❌ Khi có lỗi

**Browser Console:**
```
❌ WebSocket Connection Error
   Message: xhr poll error
   Target URL: ws://103.179.172.89:3001
   Environment: Vercel (production)

🔍 Troubleshooting:
   1. Check if WebSocket server is running on VPS
   2. Verify ALLOWED_ORIGINS includes your domain
   3. Check firewall allows port 3001
```

## ⚠️ Common Issues

### 1. Connection Timeout

**Kiểm tra:**
```bash
# Test health check
curl http://103.179.172.89:3001/health

# Kiểm tra server trên VPS
netstat -an | findstr 3001
```

### 2. CORS Error

**Fix:**
```powershell
# Trên VPS
cd websocket-server
notepad .env

# Thêm domain Vercel
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# Restart
node server.js
```

### 3. Mixed Content (HTTPS/WS)

**Triệu chứng:** Vercel (HTTPS) không kết nối được WS (không secure)

**Giải pháp tạm thời:** Dùng HTTP cho preview deployment

**Giải pháp lâu dài:** Setup WSS với SSL certificate

## 📚 Tài liệu đầy đủ

- **[VERCEL_WEBSOCKET_DEBUG.md](./VERCEL_WEBSOCKET_DEBUG.md)** - Hướng dẫn chi tiết debug trên Vercel
- **[CONNECT_DEV_TO_VPS.md](./CONNECT_DEV_TO_VPS.md)** - Kết nối dev tới VPS
- **[DEV_WEBSOCKET_SETUP.md](./DEV_WEBSOCKET_SETUP.md)** - Setup WebSocket cho dev

## 🎯 Quick Commands

```bash
# Test WebSocket connection
pnpm test:ws-connection

# Run dev
pnpm dev

# Build for production
pnpm build
```

## ✨ Features

- ✅ Chi tiết logs trong console
- ✅ Debug UI với real-time status
- ✅ Environment detection (Local/Vercel)
- ✅ Error messages với troubleshooting
- ✅ Reconnection tracking
- ✅ Test script để verify connection

Bây giờ bạn có thể dễ dàng debug WebSocket connection trên cả local và Vercel production! 🚀
