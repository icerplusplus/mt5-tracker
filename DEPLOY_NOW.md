# 🚀 Deploy Ngay - VPS 103.179.172.89:10000

## ⚡ Quick Start (4 Bước - 15 Phút)

### 📦 Bước 1: Upload Lên VPS (5 phút)

```cmd
# Trên VPS Windows
cd C:\
git clone your-repo mt5-trading
cd mt5-trading
pnpm install
pnpm build
```

### ⚙️ Bước 2: Chạy Server (2 phút)

```cmd
# Cài PM2
npm install -g pm2-windows

# Start server
set PORT=10000
pm2 start server.js --name mt5-app
pm2 save

# Mở firewall
New-NetFirewallRule -DisplayName "MT5 App" -Direction Inbound -LocalPort 10000 -Protocol TCP -Action Allow
```

### 🤖 Bước 3: Cấu Hình EA Bot (3 phút)

**MT5 Settings:**
```
API_URL = 127.0.0.1:10000/api/mt5
API_KEY = your_secure_random_api_key_min_32_chars
```

**MT5 Options:**
- Tools → Options → Expert Advisors
- Allow WebRequest for: `http://127.0.0.1:10000`

**Attach EA Bot vào chart**

### ☁️ Bước 4: Deploy Vercel (5 phút)

```bash
# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
# Nhập: http://103.179.172.89:10000

vercel env add NEXT_PUBLIC_SUPABASE_URL
# Nhập: https://rkqwppokwrgushngugpv.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Nhập: eyJhbGc...

vercel env add MT5_API_KEY
# Nhập: your_secure_random_api_key_min_32_chars

# Deploy
vercel --prod
```

---

## ✅ Test

### Test VPS:
```bash
curl http://103.179.172.89:10000/api/mt5/bot-status
```

### Test EA Bot:
- Kiểm tra MT5 log: `✓ Success! HTTP 200`

### Test Vercel:
- Truy cập: `https://your-app.vercel.app`
- Chart hiển thị → OK!

---

## 🔑 Environment Variables

### VPS (.env.local)
```env
PORT=10000
MT5_API_KEY=your_secure_random_api_key_min_32_chars
NEXT_PUBLIC_SUPABASE_URL=https://rkqwppokwrgushngugpv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Vercel
```env
NEXT_PUBLIC_API_URL=http://103.179.172.89:10000
NEXT_PUBLIC_SUPABASE_URL=https://rkqwppokwrgushngugpv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
MT5_API_KEY=your_secure_random_api_key_min_32_chars
```

### EA Bot
```
API_URL = 127.0.0.1:10000/api/mt5
API_KEY = your_secure_random_api_key_min_32_chars
```

---

## 🛠️ Commands

```bash
# VPS
pm2 status              # Check status
pm2 logs mt5-app        # View logs
pm2 restart mt5-app     # Restart

# Test
curl http://103.179.172.89:10000/api/mt5/bot-status

# Deploy
vercel --prod
```

---

## 📚 Chi Tiết

Xem file: `SETUP_VPS_103.179.172.89.md`

---

**VPS URL:** `http://103.179.172.89:10000`

**Ready to deploy!** 🎉
