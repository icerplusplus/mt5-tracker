# VPS MT5 Setup Guide - Kết Nối Web App với MT5 trên VPS

## Tổng Quan

Có 2 cách để web app giao tiếp với MT5 trên VPS:

### Option 1: Reverse Proxy (Recommended) ⭐
Web App → Internet → VPS (Nginx/Caddy) → MT5 EA Bot

### Option 2: Direct Connection
Web App → Internet → VPS:Port → MT5 EA Bot

## Option 1: Reverse Proxy (Recommended)

### Ưu Điểm
- ✅ Secure (HTTPS/SSL)
- ✅ Không cần mở nhiều ports
- ✅ Easy to manage
- ✅ Can add authentication
- ✅ Load balancing support

### Setup Steps

#### 1. Install Web Server trên VPS

**Ubuntu/Debian**:
```bash
# Install Nginx
sudo apt update
sudo apt install nginx -y

# Or install Caddy (easier SSL)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy -y
```

**Windows VPS**:
```powershell
# Install Caddy
# Download from: https://caddyserver.com/download
# Or use Chocolatey:
choco install caddy
```

#### 2. Setup Node.js API Server trên VPS

**File**: `vps-server.js`

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// CORS - Allow your web app domain
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));

app.use(express.json());

// API Key authentication
const API_KEY = process.env.MT5_API_KEY || 'your_secure_api_key_here';

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Proxy endpoints to your local MT5 web app
app.use('/api/mt5', authenticateApiKey, (req, res) => {
  // Forward to local MT5 web app
  const localUrl = `http://localhost:3000${req.path}`;
  
  // Use fetch or axios to forward request
  fetch(localUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
  })
  .then(response => response.json())
  .then(data => res.json(data))
  .catch(error => res.status(500).json({ error: error.message }));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VPS API Server running on port ${PORT}`);
});
```

**Install dependencies**:
```bash
npm init -y
npm install express cors node-fetch
```

**Run with PM2** (auto-restart):
```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start vps-server.js --name mt5-api

# Auto-start on reboot
pm2 startup
pm2 save
```

#### 3. Configure Reverse Proxy

**Option A: Nginx**

**File**: `/etc/nginx/sites-available/mt5-api`

```nginx
server {
    listen 80;
    server_name your-vps-ip-or-domain.com;

    location /api/mt5 {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable site**:
```bash
sudo ln -s /etc/nginx/sites-available/mt5-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Option B: Caddy** (Easier, auto SSL)

**File**: `/etc/caddy/Caddyfile`

```caddy
your-vps-ip-or-domain.com {
    reverse_proxy /api/mt5/* localhost:4000
}
```

**Reload Caddy**:
```bash
sudo systemctl reload caddy
```

#### 4. Configure Firewall

**Ubuntu/Debian**:
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

**Windows**:
```powershell
# Open Windows Firewall
# Add inbound rule for port 80 and 443
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

#### 5. Update Web App API URL

**File**: `.env.local` (on your local machine)

```env
# Change from localhost to VPS
NEXT_PUBLIC_API_URL=http://your-vps-ip-or-domain.com/api/mt5
# Or with HTTPS:
NEXT_PUBLIC_API_URL=https://your-vps-ip-or-domain.com/api/mt5

MT5_API_KEY=your_secure_api_key_here
```

**Update API calls** (if needed):

```typescript
// lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/mt5';

export async function fetchMT5Data(endpoint: string, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.MT5_API_KEY,
      ...options.headers
    }
  });
  return response.json();
}
```

## Option 2: Direct Connection (Simple but Less Secure)

### Setup Steps

#### 1. Configure MT5 Web App to Listen on 0.0.0.0

**File**: `server.js` (on VPS)

```javascript
// Change from localhost to 0.0.0.0
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

#### 2. Open Port on VPS Firewall

**Ubuntu/Debian**:
```bash
sudo ufw allow 3000/tcp
sudo ufw enable
```

**Windows**:
```powershell
New-NetFirewallRule -DisplayName "MT5 API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

#### 3. Open Port on Cloud Provider

**AWS EC2**:
1. Go to EC2 → Security Groups
2. Select your instance's security group
3. Add Inbound Rule:
   - Type: Custom TCP
   - Port: 3000
   - Source: Your IP or 0.0.0.0/0 (anywhere)

**Google Cloud**:
```bash
gcloud compute firewall-rules create allow-mt5-api \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow MT5 API"
```

**Azure**:
1. Go to Virtual Machine → Networking
2. Add inbound port rule:
   - Port: 3000
   - Protocol: TCP
   - Source: Any

**DigitalOcean**:
1. Go to Networking → Firewalls
2. Add Inbound Rule:
   - Type: Custom
   - Protocol: TCP
   - Port: 3000
   - Sources: All IPv4, All IPv6

#### 4. Update Web App API URL

```env
NEXT_PUBLIC_API_URL=http://your-vps-ip:3000/api/mt5
MT5_API_KEY=your_secure_api_key_here
```

## Security Best Practices

### 1. Use HTTPS (SSL/TLS)

**With Caddy** (Auto SSL):
```caddy
your-domain.com {
    reverse_proxy /api/mt5/* localhost:4000
}
```

**With Nginx + Let's Encrypt**:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 2. API Key Authentication

Already implemented in EA Bot and API endpoints.

### 3. Rate Limiting

**Nginx**:
```nginx
limit_req_zone $binary_remote_addr zone=mt5_limit:10m rate=10r/s;

server {
    location /api/mt5 {
        limit_req zone=mt5_limit burst=20;
        proxy_pass http://localhost:4000;
    }
}
```

**Express**:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // limit each IP to 100 requests per minute
});

app.use('/api/mt5', limiter);
```

### 4. IP Whitelist (Optional)

**Nginx**:
```nginx
location /api/mt5 {
    allow your-home-ip;
    allow your-office-ip;
    deny all;
    
    proxy_pass http://localhost:4000;
}
```

### 5. VPN (Most Secure)

Setup VPN between your local machine and VPS:
- WireGuard
- OpenVPN
- Tailscale (easiest)

## Testing

### 1. Test from VPS

```bash
# Test local server
curl http://localhost:3000/api/mt5/bot-status

# Test reverse proxy
curl http://localhost/api/mt5/bot-status
```

### 2. Test from Local Machine

```bash
# Test direct connection
curl http://your-vps-ip:3000/api/mt5/bot-status

# Test reverse proxy
curl http://your-vps-ip/api/mt5/bot-status

# Test with API key
curl -H "X-API-Key: your_api_key" http://your-vps-ip/api/mt5/bot-status
```

### 3. Test from Web App

```javascript
// In browser console
fetch('http://your-vps-ip/api/mt5/bot-status', {
  headers: {
    'X-API-Key': 'your_api_key'
  }
})
.then(r => r.json())
.then(console.log);
```

## Troubleshooting

### Connection Refused

**Check if server is running**:
```bash
# Linux
sudo netstat -tulpn | grep 3000

# Windows
netstat -ano | findstr :3000
```

**Check firewall**:
```bash
# Linux
sudo ufw status

# Windows
Get-NetFirewallRule | Where-Object {$_.LocalPort -eq 3000}
```

### CORS Errors

Update CORS settings in `server.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://your-vps-ip', 'https://your-domain.com'],
  credentials: true
}));
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Your Local Machine                                          │
│                                                             │
│  ┌──────────────┐                                          │
│  │  Web Browser │                                          │
│  │  (localhost) │                                          │
│  └──────┬───────┘                                          │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
          │ HTTPS (Port 443)
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ VPS (Cloud Server)                                          │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │    Nginx     │────────▶│  Node.js API │                │
│  │  (Port 80)   │         │  (Port 4000) │                │
│  └──────────────┘         └──────┬───────┘                │
│                                   │                         │
│                                   ▼                         │
│                          ┌──────────────┐                  │
│                          │  Next.js App │                  │
│                          │  (Port 3000) │                  │
│                          └──────┬───────┘                  │
│                                 │                           │
│                                 ▼                           │
│                          ┌──────────────┐                  │
│                          │  Supabase DB │                  │
│                          └──────┬───────┘                  │
│                                 │                           │
│                                 ▼                           │
│                          ┌──────────────┐                  │
│                          │  MT5 EA Bot  │                  │
│                          │  (Terminal)  │                  │
│                          └──────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Recommended Setup

1. ✅ Use **Reverse Proxy** (Nginx or Caddy)
2. ✅ Enable **HTTPS** with Let's Encrypt
3. ✅ Use **API Key** authentication
4. ✅ Enable **Rate Limiting**
5. ✅ Use **PM2** for auto-restart
6. ✅ Setup **Monitoring** (optional)

## Quick Start Commands

```bash
# 1. Install dependencies on VPS
sudo apt update
sudo apt install nginx nodejs npm -y
npm install -g pm2

# 2. Clone your project
git clone your-repo
cd your-project

# 3. Install packages
pnpm install

# 4. Setup environment
cp .env.example .env.local
nano .env.local  # Edit with your settings

# 5. Build and start
pnpm build
pm2 start npm --name "mt5-app" -- start

# 6. Configure Nginx
sudo nano /etc/nginx/sites-available/mt5-api
# (paste config from above)
sudo ln -s /etc/nginx/sites-available/mt5-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. Open firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 8. Done! Test from local machine
curl http://your-vps-ip/api/mt5/bot-status
```

---

**Status**: Complete Setup Guide
**Recommended**: Option 1 (Reverse Proxy)
**Security**: HTTPS + API Key + Rate Limiting
