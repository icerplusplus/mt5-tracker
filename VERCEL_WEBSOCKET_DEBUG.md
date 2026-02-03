# Debug WebSocket Connection trên Vercel Production

## 🎯 Mục tiêu

Kiểm tra xem web app deploy trên Vercel có kết nối được với WebSocket server trên VPS hay không.

## ✅ Đã thêm

### 1. **Chi tiết Console Logs** (`lib/websocket/client.ts`)
   - Environment info (NODE_ENV, Vercel environment, URL)
   - Connection details (Socket ID, Transport, Timestamp)
   - Error messages với troubleshooting steps
   - Reconnection tracking

### 2. **WebSocket Debug UI** (`app/components/WebSocketDebug.tsx`)
   - Floating button (góc dưới bên phải)
   - Real-time connection status
   - Environment info
   - Troubleshooting tips

## 🔍 Cách kiểm tra trên Vercel Production

### Phương pháp 1: Browser Console (Khuyến nghị)

1. **Truy cập app trên Vercel:**
   ```
   https://your-app.vercel.app
   ```

2. **Mở Developer Console:**
   - Nhấn `F12` hoặc `Ctrl+Shift+I` (Windows)
   - Hoặc `Cmd+Option+I` (Mac)

3. **Xem logs:**
   
   **Khi kết nối thành công:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔌 WebSocket Client Initialization
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📍 Environment Info:
      NODE_ENV: production
      Is Production: true
      Is Vercel: true
      Vercel Environment: production
      Vercel URL: your-app.vercel.app
      Current Origin: https://your-app.vercel.app
   
   🔗 Connection Details:
      WebSocket URL: ws://103.179.172.89:3001
      Transports: websocket, polling
      Reconnection: enabled (max 10 attempts)
      Timeout: 20000ms
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ⏳ Attempting to connect...
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ WebSocket Connected Successfully!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 Connection Info:
      Socket ID: abc123xyz
      Server URL: ws://103.179.172.89:3001
      Transport: websocket
      Connected At: 2026-02-03T07:30:45.123Z
      Environment: Vercel (production)
      Client Origin: https://your-app.vercel.app
      Client URL: https://your-app.vercel.app/
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

   **Khi có lỗi:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ❌ WebSocket Connection Error
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 Error Details:
      Message: xhr poll error
      Type: TransportError
      Description: N/A
      Timestamp: 2026-02-03T07:30:45.123Z
      Target URL: ws://103.179.172.89:3001
      Environment: Vercel (production)
      Client Origin: https://your-app.vercel.app
   
   🔍 Troubleshooting:
      1. Check if WebSocket server is running on VPS
      2. Verify ALLOWED_ORIGINS includes your domain
      3. Check firewall allows port 3001
      4. Test health check: curl http://103.179.172.89:3001/health
      5. Verify NEXT_PUBLIC_WS_URL is set in Vercel environment variables
      6. Check Vercel logs for network issues
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

### Phương pháp 2: WebSocket Debug UI

1. **Tìm nút debug:**
   - Góc dưới bên phải màn hình
   - Nút tròn với icon sét ⚡
   - Màu xanh = connected, đỏ = disconnected, vàng = reconnecting

2. **Click để xem thông tin:**
   - Connection status
   - Socket ID
   - Transport type
   - WebSocket URL
   - Environment info
   - Vercel URL
   - Last connected/disconnected time
   - Troubleshooting tips

### Phương pháp 3: Vercel Logs

1. **Truy cập Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Chọn project → Deployments → Latest deployment**

3. **Click "View Function Logs"**

4. **Tìm logs liên quan đến WebSocket:**
   - Filter: "WebSocket" hoặc "Socket"
   - Xem client-side logs (nếu có)

**Lưu ý:** Vercel chỉ log server-side code. Client-side logs (WebSocket) chỉ hiển thị trong browser console.

### Phương pháp 4: Network Tab

1. **Mở Developer Tools → Network tab**

2. **Filter: WS (WebSocket)**

3. **Reload trang**

4. **Xem WebSocket connection:**
   - Status: 101 Switching Protocols = Success
   - Status: Failed = Connection error

5. **Click vào connection để xem:**
   - Headers
   - Messages (realtime data)
   - Timing

## 🔧 Cấu hình Vercel Environment Variables

### 1. Truy cập Vercel Dashboard

```
https://vercel.com/dashboard → Your Project → Settings → Environment Variables
```

### 2. Thêm biến môi trường

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_WS_URL` | `ws://103.179.172.89:3001` | Production, Preview, Development |

**Lưu ý:** Biến bắt đầu với `NEXT_PUBLIC_` sẽ được expose ra client-side.

### 3. Redeploy

Sau khi thêm environment variables, cần redeploy:
- Click "Redeploy" trong Deployments tab
- Hoặc push commit mới lên GitHub

## 📊 Kiểm tra trên VPS

Khi Vercel app kết nối, VPS logs sẽ hiển thị:

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

**Cách xem logs trên VPS:**

```powershell
# Nếu chạy trực tiếp
# Logs hiển thị trong terminal

# Nếu chạy với PM2
pm2 logs mt5-websocket

# Hoặc xem realtime
pm2 logs mt5-websocket --lines 100
```

## ⚠️ Troubleshooting

### Lỗi: Connection timeout

**Nguyên nhân:**
- WebSocket server không chạy trên VPS
- Firewall chặn port 3001
- VPS offline

**Giải pháp:**

1. **Kiểm tra server trên VPS:**
   ```powershell
   # Kiểm tra process
   Get-Process node
   
   # Kiểm tra port
   netstat -an | findstr 3001
   ```

2. **Test health check:**
   ```bash
   curl http://103.179.172.89:3001/health
   ```

3. **Kiểm tra firewall:**
   ```powershell
   Get-NetFirewallRule -DisplayName "WebSocket Server"
   ```

### Lỗi: CORS blocked

**Triệu chứng:** Console hiển thị CORS error

**Nguyên nhân:** `ALLOWED_ORIGINS` trên VPS chưa có domain Vercel

**Giải pháp:**

1. **Lấy domain Vercel:**
   - Vercel Dashboard → Project → Domains
   - Ví dụ: `your-app.vercel.app`

2. **Cập nhật `.env` trên VPS:**
   ```env
   ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app,https://your-app-*.vercel.app
   ```

3. **Restart server:**
   ```powershell
   # Ctrl+C rồi chạy lại
   node server.js
   ```

### Lỗi: Mixed content (HTTP/HTTPS)

**Triệu chứng:** 
```
Mixed Content: The page at 'https://your-app.vercel.app' was loaded over HTTPS, 
but attempted to connect to the insecure WebSocket endpoint 'ws://103.179.172.89:3001'
```

**Nguyên nhân:** Vercel dùng HTTPS, nhưng WebSocket dùng WS (không secure)

**Giải pháp:**

**Option 1: Cho phép mixed content (không khuyến nghị)**
- Browser settings → Allow insecure content

**Option 2: Dùng WSS (khuyến nghị)**
- Setup nginx reverse proxy với SSL trên VPS
- Hoặc dùng Cloudflare Tunnel

**Option 3: Dùng HTTP cho dev (tạm thời)**
- Deploy preview branch với custom domain không SSL

### Lỗi: Environment variable không load

**Triệu chứng:** Console log hiển thị `undefined` cho `NEXT_PUBLIC_WS_URL`

**Giải pháp:**

1. **Kiểm tra Vercel Environment Variables:**
   - Settings → Environment Variables
   - Đảm bảo có `NEXT_PUBLIC_WS_URL`

2. **Redeploy:**
   - Deployments → Latest → Redeploy

3. **Kiểm tra trong build logs:**
   - Xem có warning về missing env vars không

## 📋 Checklist Deploy Production

Trước khi deploy lên Vercel, kiểm tra:

- [ ] WebSocket server đang chạy trên VPS
- [ ] Port 3001 đã mở firewall
- [ ] `ALLOWED_ORIGINS` có domain Vercel
- [ ] `NEXT_PUBLIC_WS_URL` đã set trong Vercel
- [ ] Health check hoạt động: `curl http://103.179.172.89:3001/health`
- [ ] Test từ local trước: `pnpm dev`

## 🎯 Kết luận

Sau khi deploy, bạn có thể:

1. ✅ Xem logs chi tiết trong browser console (F12)
2. ✅ Dùng WebSocket Debug UI để monitor realtime
3. ✅ Kiểm tra Network tab để xem WebSocket messages
4. ✅ Xem VPS logs để confirm connection từ Vercel
5. ✅ Debug và troubleshoot nhanh chóng

**Logs sẽ cho bạn biết:**
- Environment (production/preview/development)
- Vercel URL
- Connection status
- Error messages với troubleshooting steps
- Reconnection attempts

Happy debugging! 🚀
