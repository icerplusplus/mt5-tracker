# Hướng Dẫn Deploy: Vercel + VPS

## Tổng Quan Kiến Trúc

```
Vercel (Web App) ←→ VPS (API Server) ←→ MT5 EA Bot
                ↓
            Supabase (Database)
```

**Luồng hoạt động:**
1. EA Bot (MT5) → VPS API Server (localhost:4000) → Supabase
2. Vercel Web App → VPS API Server (public IP) → Supabase
3. Vercel Web App ← Supabase Realtime ← VPS API Server

---

## Phần 1: Setup VPS (Windows)

### Bước 1: Cài Đặt Node.js trên VPS

**Download Node.js:**
- Truy cập: https://nodejs.org/
- Download phiên bản LTS (Long Term Support)
- Cài đặt với tùy chọn mặc định

**Kiểm tra cài đặt:**
```cmd
node --version
npm --version
```

### Bước 2: Upload Project lên VPS

**Option A: Dùng Git**
```cmd
cd C:\
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

**Option B: Upload thủ công**
- Dùng Remote Desktop
- Copy folder project vào VPS (ví dụ: `C:\mt5-trading`)

### Bước 3: Cài Đặt Dependencies

```cmd
cd C:\mt5-trading
npm install express cors @supabase/supabase-js dotenv
npm install -g pm2-windows
```

### Bước 4: Tạo File `.env` trên VPS

Tạo file `C:\mt5-trading\.env`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Service role key (quan trọng!)

# API Key
MT5_API_KEY=your_secure_api_key_here

# Server
PORT=4000
```

**Lấy Service Role Key:**
1. Truy cập Supabase Dashboard
2. Settings → API
3. Copy "service_role" key (không phải anon key!)

### Bước 5: Chạy API Server

**Test chạy thử:**
```cmd
node vps-server.js
```

Nếu thấy:
```
✅ VPS API Server running on port 4000
📡 Listening for EA Bot on http://localhost:4000
🌐 Accessible from Vercel via public IP
```
→ Thành công!

**Chạy với PM2 (auto-restart):**
```cmd
pm2 start vps-server.js --name mt5-api
pm2 save
pm2 startup
```

PM2 sẽ tự động restart khi VPS reboot.

### Bước 6: Mở Firewall trên VPS

**Windows Firewall:**
```powershell
# Mở PowerShell as Administrator
New-NetFirewallRule -DisplayName "MT5 API Server" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

**Hoặc dùng GUI:**
1. Windows Defender Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port → TCP → 4000 → Allow

### Bước 7: Mở Port trên Cloud Provider

**Nếu dùng AWS EC2:**
1. EC2 Dashboard → Security Groups
2. Select security group của VPS
3. Inbound Rules → Add Rule:
   - Type: Custom TCP
   - Port: 4000
   - Source: 0.0.0.0/0 (hoặc chỉ IP của Vercel)

**Nếu dùng Azure:**
1. Virtual Machine → Networking
2. Add inbound port rule:
   - Port: 4000
   - Protocol: TCP
   - Source: Any

**Nếu dùng Google Cloud:**
```bash
gcloud compute firewall-rules create allow-mt5-api \
  --allow tcp:4000 \
  --source-ranges 0.0.0.0/0
```

**Nếu dùng DigitalOcean:**
1. Networking → Firewalls
2. Inbound Rules → Add Rule:
   - Type: Custom
   - Protocol: TCP
   - Port: 4000
   - Sources: All IPv4

### Bước 8: Lấy Public IP của VPS

**Windows:**
```cmd
curl ifconfig.me
```

**Hoặc:**
- Truy cập: https://whatismyipaddress.com/

Lưu lại IP này (ví dụ: `203.0.113.45`)

### Bước 9: Test API từ Bên Ngoài

Từ máy local của bạn:

```bash
# Test health check
curl http://203.0.113.45:4000/health

# Test với API key
curl -H "X-API-Key: your_secure_api_key_here" http://203.0.113.45:4000/api/mt5/bot-status
```

Nếu nhận được response → Thành công!

---

## Phần 2: Cấu Hình EA Bot trên VPS

### Bước 1: Sửa EA Bot Config

Trong MT5 trên VPS, mở EA Bot settings:

```
API_URL = 127.0.0.1:4000/api/mt5
API_KEY = your_secure_api_key_here
```

**Lưu ý:** Dùng `127.0.0.1` (localhost) vì EA Bot và API Server cùng trên VPS.

### Bước 2: Allow WebRequest trong MT5

1. Tools → Options → Expert Advisors
2. Check "Allow WebRequest for listed URL"
3. Add URL: `http://127.0.0.1:4000`
4. Click OK

### Bước 3: Attach EA Bot vào Chart

1. Kéo `MT5_WebApp_Connector.mq5` vào chart
2. Kiểm tra log trong "Experts" tab
3. Nếu thấy "✓ Success! HTTP 200" → Thành công!

---

## Phần 3: Deploy Web App lên Vercel

### Bước 1: Chuẩn Bị Project

**Tạo file `vercel.json`:**

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

**Cập nhật `.env.local` → `.env.production`:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# VPS API URL (thay bằng IP VPS của bạn)
NEXT_PUBLIC_VPS_API_URL=http://203.0.113.45:4000

# API Key
MT5_API_KEY=your_secure_api_key_here
```

### Bước 2: Sửa API Routes để Gọi VPS

Tạo file `lib/vps-client.ts`:

```typescript
const VPS_API_URL = process.env.NEXT_PUBLIC_VPS_API_URL || 'http://localhost:4000';
const API_KEY = process.env.MT5_API_KEY;

export async function fetchFromVPS(endpoint: string, options: RequestInit = {}) {
  const url = `${VPS_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`VPS API error: ${response.status}`);
  }

  return response.json();
}
```

**Sửa các API routes:**

Ví dụ `app/api/mt5/account-info/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { fetchFromVPS } from '@/lib/vps-client';

export async function GET() {
  try {
    const data = await fetchFromVPS('/api/mt5/account-info');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Bước 3: Deploy lên Vercel

**Option A: Dùng Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Option B: Dùng GitHub Integration**

1. Push code lên GitHub
2. Truy cập: https://vercel.com/new
3. Import repository
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_VPS_API_URL`
   - `MT5_API_KEY`
5. Deploy

### Bước 4: Test Web App

Truy cập: `https://your-app.vercel.app`

Kiểm tra:
- ✅ Chart hiển thị
- ✅ Positions realtime
- ✅ Account info cập nhật
- ✅ Place order hoạt động

---

## Phần 4: Bảo Mật (Quan Trọng!)

### 1. Dùng HTTPS cho VPS (Recommended)

**Cài Caddy (Web Server với Auto SSL):**

```powershell
# Download Caddy for Windows
# https://caddyserver.com/download
```

**Tạo file `Caddyfile`:**

```caddy
your-domain.com {
    reverse_proxy localhost:4000
}
```

**Chạy Caddy:**

```cmd
caddy run
```

Caddy sẽ tự động lấy SSL certificate từ Let's Encrypt.

**Update VPS API URL:**

```env
NEXT_PUBLIC_VPS_API_URL=https://your-domain.com
```

### 2. IP Whitelist (Optional)

Trong `vps-server.js`, thêm middleware:

```javascript
const ALLOWED_IPS = [
  '76.76.21.0/24',  // Vercel IP range (example)
  // Add more Vercel IP ranges
];

function ipWhitelist(req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Check if IP is in whitelist
  const isAllowed = ALLOWED_IPS.some(range => {
    // IP range checking logic
    return true; // Simplified
  });
  
  if (!isAllowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
}

app.use(ipWhitelist);
```

**Lấy Vercel IP ranges:**
- https://vercel.com/docs/concepts/edge-network/overview#ip-addresses

### 3. Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});

app.use('/api/', limiter);
```

---

## Phần 5: Monitoring & Logs

### PM2 Monitoring

```cmd
# View logs
pm2 logs mt5-api

# Monitor CPU/Memory
pm2 monit

# Restart
pm2 restart mt5-api

# Stop
pm2 stop mt5-api
```

### Supabase Logs

1. Supabase Dashboard → Logs
2. Xem API requests, errors

---

## Troubleshooting

### Lỗi: Connection Refused

**Kiểm tra:**
```cmd
# VPS có chạy API server không?
pm2 status

# Port 4000 có mở không?
netstat -ano | findstr :4000

# Firewall có block không?
Test-NetConnection -ComputerName localhost -Port 4000
```

### Lỗi: CORS Error

**Thêm domain Vercel vào CORS:**

```javascript
app.use(cors({
  origin: [
    'https://your-app.vercel.app',
    'https://your-app-git-main.vercel.app',
    /\.vercel\.app$/
  ]
}));
```

### Lỗi: 401 Unauthorized

**Kiểm tra API Key:**
- EA Bot API_KEY
- Vercel MT5_API_KEY
- VPS .env MT5_API_KEY

Phải giống nhau!

### Lỗi: Supabase Connection

**Kiểm tra Service Role Key:**
- Phải dùng `service_role` key, không phải `anon` key
- Key phải có quyền insert/update/delete

---

## Chi Phí Ước Tính

| Dịch Vụ | Chi Phí | Ghi Chú |
|---------|---------|---------|
| **Vercel** | $0 | Free tier (Hobby) |
| **Supabase** | $0 | Free tier (500MB DB) |
| **VPS** | $5-20/tháng | Tùy provider |
| **Domain** | $10/năm | Optional (cho HTTPS) |

**Tổng:** ~$5-20/tháng (chỉ VPS)

---

## Checklist Hoàn Thành

### VPS Setup
- [ ] Node.js đã cài
- [ ] Dependencies đã cài (`npm install`)
- [ ] File `.env` đã tạo với đúng keys
- [ ] API Server chạy (`pm2 start vps-server.js`)
- [ ] Firewall đã mở port 4000
- [ ] Cloud provider đã mở port 4000
- [ ] Test API từ bên ngoài thành công

### EA Bot Setup
- [ ] EA Bot config đúng (`127.0.0.1:4000`)
- [ ] WebRequest đã allow trong MT5
- [ ] EA Bot attach vào chart
- [ ] Log hiển thị "✓ Success! HTTP 200"

### Vercel Setup
- [ ] Code đã push lên GitHub
- [ ] Environment variables đã set
- [ ] Deploy thành công
- [ ] Web app truy cập được
- [ ] Realtime updates hoạt động

### Bảo Mật
- [ ] API Key đủ mạnh (random string)
- [ ] HTTPS đã setup (optional)
- [ ] Rate limiting đã enable (optional)

---

## Kết Luận

Với setup này:
- ✅ EA Bot giao tiếp với API Server trên VPS (localhost)
- ✅ Vercel gọi API Server qua public IP
- ✅ Không cần bên thứ 3 (ngrok, cloudflare tunnel)
- ✅ Kiến trúc đơn giản, dễ maintain
- ✅ Chi phí thấp (~$5-20/tháng)

**Luồng data:**
```
MT5 EA Bot → VPS API (localhost) → Supabase
                ↑
            Vercel Web App
```

Mọi thứ đều qua VPS API Server làm trung gian!
