# 🚀 Setup Guide: VPS 103.179.172.89:10000

## Thông Tin VPS

- **IP:** `103.179.172.89`
- **Port:** `10000`
- **URL:** `http://103.179.172.89:10000`

---

## ✅ Bước 1: Setup Trên VPS (Windows)

### 1.1. Upload Project Lên VPS

**Option A: Dùng Git**
```cmd
cd C:\
git clone https://github.com/your-username/your-repo.git mt5-trading
cd mt5-trading
```

**Option B: Upload Thủ Công**
- Dùng Remote Desktop
- Copy folder project vào `C:\mt5-trading`

### 1.2. Cài Đặt Dependencies

```cmd
cd C:\mt5-trading

# Cài pnpm (nếu chưa có)
npm install -g pnpm

# Cài dependencies
pnpm install
```

### 1.3. Tạo File `.env.local`

Tạo file `C:\mt5-trading\.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# API Key (phải giống với EA Bot)
MT5_API_KEY=your_secure_api_key_here

# Port (10000 cho VPS này)
PORT=10000

# WebSocket Port
WEBSOCKET_PORT=10001
```

### 1.4. Build Project

```cmd
pnpm build
```

### 1.5. Chạy Server

**Test chạy thử:**
```cmd
set NODE_ENV=production
node server.js
```

Nếu thấy:
```
✅ Server ready on http://0.0.0.0:10000
✅ Socket.IO ready on ws://0.0.0.0:10000
```
→ Thành công!

**Chạy với PM2 (auto-restart):**
```cmd
# Cài PM2
npm install -g pm2-windows

# Start server
pm2 start server.js --name mt5-app

# Save để auto-start khi reboot
pm2 save
pm2 startup
```

### 1.6. Mở Firewall Trên VPS

**Windows Firewall:**
```powershell
# Mở PowerShell as Administrator
New-NetFirewallRule -DisplayName "MT5 Trading App" -Direction Inbound -LocalPort 10000 -Protocol TCP -Action Allow
```

**Hoặc dùng GUI:**
1. Windows Defender Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port → TCP → 10000 → Allow

### 1.7. Test Từ VPS

```cmd
# Test từ localhost
curl http://localhost:10000/api/mt5/bot-status

# Test từ 0.0.0.0
curl http://0.0.0.0:10000/api/mt5/bot-status
```

---

## ✅ Bước 2: Cấu Hình EA Bot

### 2.1. Sửa EA Bot Settings

Trong MT5 trên VPS, mở EA Bot settings:

```
API_URL = 127.0.0.1:10000/api/mt5
API_KEY = your_secure_api_key_here
UPDATE_INTERVAL = 1
```

**⚠️ Quan trọng:** Dùng `127.0.0.1` (localhost) vì EA Bot và Server cùng trên VPS.

### 2.2. Allow WebRequest Trong MT5

1. Tools → Options → Expert Advisors
2. Check "Allow WebRequest for listed URL"
3. Add URL: `http://127.0.0.1:10000`
4. Click OK

### 2.3. Attach EA Bot Vào Chart

1. Kéo `MT5_WebApp_Connector.mq5` vào chart
2. Kiểm tra log trong "Experts" tab
3. Tìm dòng: `✓ Success! HTTP 200`

Nếu thấy → EA Bot đã kết nối thành công!

---

## ✅ Bước 3: Test Từ Bên Ngoài

### 3.1. Test Từ Máy Local

```bash
# Test health
curl http://103.179.172.89:10000/api/mt5/bot-status

# Test với API key
curl -H "X-API-Key: your_secure_api_key_here" http://103.179.172.89:10000/api/mt5/bot-status
```

### 3.2. Test Trong Browser

Mở browser, truy cập:
```
http://103.179.172.89:10000
```

Nếu thấy trang web → Thành công!

---

## ✅ Bước 4: Deploy Vercel

### 4.1. Tạo File `.env.production`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# VPS URL
NEXT_PUBLIC_API_URL=http://103.179.172.89:10000

# API Key
MT5_API_KEY=your_secure_api_key_here
```

### 4.2. Deploy Lên Vercel

**Option A: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_API_URL
# Nhập: http://103.179.172.89:10000
vercel env add MT5_API_KEY

# Deploy
vercel --prod
```

**Option B: GitHub + Vercel Dashboard**

1. Push code lên GitHub
2. Truy cập: https://vercel.com/new
3. Import repository
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://xxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGc...`
   - `NEXT_PUBLIC_API_URL`: `http://103.179.172.89:10000`
   - `MT5_API_KEY`: `your_secure_api_key_here`
5. Deploy

### 4.3. Test Vercel App

Truy cập: `https://your-app.vercel.app`

Kiểm tra:
- ✅ Chart hiển thị
- ✅ Positions realtime
- ✅ Account info cập nhật
- ✅ Place order hoạt động

---

## 🔧 Troubleshooting

### Lỗi: Cannot Access VPS

**Kiểm tra:**
```cmd
# 1. Server có chạy không?
pm2 status

# 2. Port 10000 có mở không?
netstat -ano | findstr :10000

# 3. Firewall có block không?
Test-NetConnection -ComputerName localhost -Port 10000
```

**Giải pháp:**
- Restart server: `pm2 restart mt5-app`
- Mở firewall: Xem bước 1.6
- Kiểm tra cloud provider có block port không

### Lỗi: EA Bot Cannot Connect

**Kiểm tra:**
1. EA Bot API_URL = `127.0.0.1:10000/api/mt5` (không phải `103.179.172.89`)
2. WebRequest đã allow `http://127.0.0.1:10000`
3. API_KEY giống nhau

**Test:**
```cmd
# Từ VPS
curl http://127.0.0.1:10000/api/mt5/bot-status
```

### Lỗi: Vercel Cannot Connect

**Kiểm tra:**
1. VPS có truy cập được từ bên ngoài không?
   ```bash
   curl http://103.179.172.89:10000/api/mt5/bot-status
   ```
2. Vercel environment variable `NEXT_PUBLIC_API_URL` đúng chưa?
3. CORS có allow Vercel domain chưa?

**Sửa CORS trong `server.js`:**
```javascript
cors: {
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',
    /\.vercel\.app$/
  ],
  methods: ['GET', 'POST']
}
```

### Lỗi: 401 Unauthorized

**Nguyên nhân:** API Key không khớp

**Kiểm tra:**
- EA Bot: `API_KEY = xxx`
- VPS `.env.local`: `MT5_API_KEY=xxx`
- Vercel env: `MT5_API_KEY=xxx`

Phải giống nhau 100%!

---

## 📊 Monitoring

### PM2 Commands

```cmd
pm2 status              # Xem trạng thái
pm2 logs mt5-app        # Xem logs
pm2 monit               # Monitor CPU/Memory
pm2 restart mt5-app     # Restart
pm2 stop mt5-app        # Stop
pm2 delete mt5-app      # Remove
```

### Logs Location

```cmd
# PM2 logs
C:\Users\Administrator\.pm2\logs\

# Application logs
pm2 logs mt5-app --lines 100
```

---

## 🔒 Bảo Mật (Recommended)

### 1. Strong API Key

```bash
# Generate random API key
openssl rand -base64 32
```

Hoặc dùng: https://www.random.org/strings/

### 2. HTTPS (Optional)

Nếu có domain, dùng Caddy để có HTTPS:

**Caddyfile:**
```caddy
your-domain.com {
    reverse_proxy localhost:10000
}
```

**Update Vercel:**
```env
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### 3. IP Whitelist (Optional)

Chỉ cho phép Vercel IP truy cập:

**Windows Firewall:**
```powershell
# Remove old rule
Remove-NetFirewallRule -DisplayName "MT5 Trading App"

# Add new rule with IP restriction
New-NetFirewallRule -DisplayName "MT5 Trading App" `
  -Direction Inbound `
  -LocalPort 10000 `
  -Protocol TCP `
  -Action Allow `
  -RemoteAddress 76.76.21.0/24  # Vercel IP range (example)
```

---

## ✅ Checklist Hoàn Thành

### VPS Setup
- [ ] Project uploaded to VPS
- [ ] Dependencies installed (`pnpm install`)
- [ ] `.env.local` created with correct values
- [ ] Project built (`pnpm build`)
- [ ] Server running (`pm2 start server.js`)
- [ ] Firewall port 10000 opened
- [ ] Test from localhost: `curl http://localhost:10000`
- [ ] Test from outside: `curl http://103.179.172.89:10000`

### EA Bot Setup
- [ ] EA Bot settings: `API_URL = 127.0.0.1:10000/api/mt5`
- [ ] EA Bot settings: `API_KEY` matches `.env.local`
- [ ] WebRequest allowed for `http://127.0.0.1:10000`
- [ ] EA Bot attached to chart
- [ ] Logs show: `✓ Success! HTTP 200`
- [ ] Supabase `bot_status` table has data

### Vercel Setup
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_API_URL = http://103.179.172.89:10000`
  - [ ] `MT5_API_KEY`
- [ ] Deployed successfully
- [ ] Web app accessible at `https://your-app.vercel.app`
- [ ] Chart displays data
- [ ] Positions update realtime
- [ ] Commands work (place order, close order)

---

## 🎯 Quick Commands Reference

```bash
# VPS - Start server
pm2 start server.js --name mt5-app

# VPS - View logs
pm2 logs mt5-app

# VPS - Restart
pm2 restart mt5-app

# Local - Test VPS
curl http://103.179.172.89:10000/api/mt5/bot-status

# Local - Deploy Vercel
vercel --prod

# Local - Test Vercel
curl https://your-app.vercel.app
```

---

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra PM2 logs: `pm2 logs mt5-app`
2. Kiểm tra MT5 Experts tab logs
3. Kiểm tra Supabase logs
4. Kiểm tra Vercel deployment logs

---

**Status:** Ready to Deploy! 🚀

**VPS URL:** `http://103.179.172.89:10000`

**Next Step:** Follow Bước 1 → Bước 2 → Bước 3 → Bước 4
