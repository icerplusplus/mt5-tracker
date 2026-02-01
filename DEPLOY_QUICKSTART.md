# 🚀 Deploy Quickstart: Vercel + VPS

## Tóm Tắt Kiến Trúc

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vercel    │◄────►│  VPS API    │◄────►│  MT5 EA Bot │
│  (Web App)  │      │   Server    │      │  (Terminal) │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │
       └────────────────────┘
                │
         ┌──────▼──────┐
         │  Supabase   │
         │  (Database) │
         └─────────────┘
```

---

## 📋 Checklist 3 Bước

### ✅ Bước 1: Setup VPS (15 phút)

```bash
# 1. Cài Node.js trên VPS
# Download: https://nodejs.org/

# 2. Upload project lên VPS
git clone your-repo
cd your-repo

# 3. Cài dependencies
npm install express cors @supabase/supabase-js dotenv
npm install -g pm2

# 4. Tạo file .env
cp .env.example .env
# Sửa: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MT5_API_KEY

# 5. Chạy server
npm run vps:start

# 6. Mở firewall port 4000
# Windows: New-NetFirewallRule -DisplayName "MT5 API" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow

# 7. Mở port trên cloud provider (AWS/Azure/GCP)
# Xem hướng dẫn trong VERCEL_VPS_SETUP.md

# 8. Test
curl http://YOUR_VPS_IP:4000/health
```

### ✅ Bước 2: Cấu Hình EA Bot (5 phút)

```
1. Mở MT5 trên VPS
2. Sửa EA Bot settings:
   - API_URL = 127.0.0.1:4000/api/mt5
   - API_KEY = your_secure_api_key_here

3. Tools → Options → Expert Advisors
   - Allow WebRequest for: http://127.0.0.1:4000

4. Attach EA Bot vào chart
5. Kiểm tra log: "✓ Success! HTTP 200"
```

### ✅ Bước 3: Deploy Vercel (10 phút)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_VPS_API_URL  # http://YOUR_VPS_IP:4000
vercel env add MT5_API_KEY

# 4. Deploy
vercel --prod

# 5. Test
# Truy cập: https://your-app.vercel.app
```

---

## 🔑 Environment Variables

### VPS (.env)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Service role key!
MT5_API_KEY=your_secure_api_key_here
PORT=4000
```

### Vercel (Environment Variables)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Anon key!
NEXT_PUBLIC_VPS_API_URL=http://YOUR_VPS_IP:4000
MT5_API_KEY=your_secure_api_key_here
```

### EA Bot (MT5 Settings)
```
API_URL = 127.0.0.1:4000/api/mt5
API_KEY = your_secure_api_key_here
```

**⚠️ Quan trọng:** API_KEY phải giống nhau ở cả 3 nơi!

---

## 🧪 Testing

### Test VPS API
```bash
# Health check
curl http://YOUR_VPS_IP:4000/health

# Bot status (cần API key)
curl -H "X-API-Key: your_api_key" http://YOUR_VPS_IP:4000/api/mt5/bot-status
```

### Test EA Bot
```
1. Kiểm tra log trong MT5 "Experts" tab
2. Tìm dòng: "✓ Success! HTTP 200"
3. Kiểm tra Supabase: bot_status table có data
```

### Test Vercel
```
1. Truy cập: https://your-app.vercel.app
2. Kiểm tra:
   - Chart hiển thị
   - Positions realtime
   - Account info cập nhật
```

---

## 🛠️ Commands Hữu Ích

### VPS Management
```bash
npm run vps:start    # Start API server
npm run vps:stop     # Stop API server
npm run vps:restart  # Restart API server
npm run vps:logs     # View logs
npm run vps:status   # Check status
```

### PM2 Commands
```bash
pm2 list             # List all processes
pm2 logs mt5-api     # View logs
pm2 monit            # Monitor CPU/Memory
pm2 restart mt5-api  # Restart
pm2 delete mt5-api   # Remove process
```

---

## 🔒 Bảo Mật (Recommended)

### 1. Dùng HTTPS cho VPS

**Cài Caddy:**
```bash
# Download: https://caddyserver.com/download
```

**Caddyfile:**
```caddy
your-domain.com {
    reverse_proxy localhost:4000
}
```

**Update VPS URL:**
```env
NEXT_PUBLIC_VPS_API_URL=https://your-domain.com
```

### 2. Strong API Key

```bash
# Generate random API key
openssl rand -base64 32
```

### 3. Rate Limiting

Đã có sẵn trong `vps-server.js` (100 requests/minute)

---

## 🐛 Troubleshooting

### Lỗi: Connection Refused
```bash
# Kiểm tra server có chạy không
pm2 status

# Kiểm tra port có mở không
netstat -ano | findstr :4000

# Kiểm tra firewall
Test-NetConnection -ComputerName YOUR_VPS_IP -Port 4000
```

### Lỗi: 401 Unauthorized
- Kiểm tra API_KEY giống nhau ở EA Bot, VPS, Vercel
- Kiểm tra header: `X-API-Key`

### Lỗi: CORS
- Thêm domain Vercel vào `vps-server.js`:
```javascript
origin: ['https://your-app.vercel.app']
```

---

## 📚 Tài Liệu Chi Tiết

- **Setup đầy đủ:** `VERCEL_VPS_SETUP.md`
- **VPS setup guide:** `VPS_MT5_SETUP_GUIDE.md`
- **Project summary:** `PROJECT_SUMMARY.md`

---

## 💰 Chi Phí

| Dịch Vụ | Chi Phí |
|---------|---------|
| Vercel | $0 (Free tier) |
| Supabase | $0 (Free tier) |
| VPS | $5-20/tháng |
| **Tổng** | **$5-20/tháng** |

---

## ✅ Success Indicators

Khi mọi thứ hoạt động đúng:

1. **VPS API Server:**
   - `pm2 status` → `online`
   - `curl http://YOUR_VPS_IP:4000/health` → `{"status":"ok"}`

2. **EA Bot:**
   - MT5 log: `✓ Success! HTTP 200`
   - Supabase `bot_status` table có data

3. **Vercel Web App:**
   - Chart hiển thị realtime
   - Positions cập nhật mỗi 0.5s
   - Place order hoạt động

---

## 🎯 Next Steps

Sau khi deploy thành công:

1. **Monitor:** Setup monitoring với PM2 hoặc external service
2. **Backup:** Backup Supabase database định kỳ
3. **Scale:** Nếu cần, upgrade VPS hoặc add load balancer
4. **Security:** Enable HTTPS, IP whitelist, 2FA

---

**Hỗ trợ:** Xem file `VERCEL_VPS_SETUP.md` để biết chi tiết!
