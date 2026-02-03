# 🚀 Deployment Guide - VPS WebSocket Server

## 📋 Prerequisites

- VPS: 103.179.172.89
- SSH access to VPS
- Node.js 18+ installed on VPS
- PM2 installed on VPS

## 🎯 Deployment Steps

### Step 1: Prepare VPS

**SSH into VPS:**
```bash
ssh root@103.179.172.89
```

**Install Node.js (if not installed):**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Install PM2:**
```bash
npm install -g pm2

# Verify installation
pm2 --version
```

### Step 2: Upload WebSocket Server

**Option A: Using SCP (from local machine):**
```bash
# From your local project root
cd /path/to/finance-tracker
scp -r websocket-server root@103.179.172.89:/root/
```

**Option B: Using Git (on VPS):**
```bash
# On VPS
cd /root
git clone https://github.com/icerplusplus/mt5-tracker.git
cd mt5-tracker/websocket-server
```

**Option C: Manual upload:**
1. Zip the `websocket-server` folder
2. Upload via SFTP/FTP
3. Unzip on VPS

### Step 3: Install Dependencies

```bash
cd /root/websocket-server
npm install
```

Expected output:
```
added 50 packages in 5s
```

### Step 4: Configure Environment

**Create .env file:**
```bash
cp .env.example .env
nano .env
```

**Update with your values:**
```env
PORT=3001
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
SUPABASE_URL=https://rkqwppokwrgushngugpv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
MT5_API_KEY=your_secure_random_api_key_min_32_chars
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Step 5: Configure Firewall

**Allow port 3001:**
```bash
ufw allow 3001/tcp
ufw reload
ufw status
```

Expected output:
```
To                         Action      From
--                         ------      ----
3001/tcp                   ALLOW       Anywhere
```

### Step 6: Start Server with PM2

**Start server:**
```bash
npm run pm2:start
```

Or:
```bash
pm2 start ecosystem.config.js
```

Expected output:
```
[PM2] Starting server.js in fork_mode (1 instance)
[PM2] Done.
┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ mode        │ ↺       │ status  │ cpu      │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ mt5-websocket│ fork        │ 0       │ online  │ 0%       │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┘
```

**Save PM2 config (auto-start on reboot):**
```bash
pm2 save
pm2 startup
```

Follow the instructions to enable auto-start.

### Step 7: Verify Server is Running

**Check PM2 status:**
```bash
pm2 status
```

**Check logs:**
```bash
pm2 logs mt5-websocket --lines 20
```

Expected logs:
```
🚀 Starting MT5 WebSocket Server...
📍 Port: 3001
📍 Host: 0.0.0.0
✅ MT5 WebSocket Server is running!
📍 HTTP: http://0.0.0.0:3001
📍 WebSocket: ws://0.0.0.0:3001
```

**Test health endpoint:**
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "MT5 WebSocket Server",
  "uptime": 10.5,
  "connections": 0,
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

### Step 8: Test from External

**From your local machine:**
```bash
curl http://103.179.172.89:3001/health
```

Should return the same JSON response.

### Step 9: Update Next.js App

**Update `.env.local` in your Next.js project:**
```env
# Change from localhost to VPS IP
NEXT_PUBLIC_WS_URL=ws://103.179.172.89:3001
```

**Or for production (Vercel):**
```env
NEXT_PUBLIC_WS_URL=ws://103.179.172.89:3001
```

### Step 10: Update Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/Update:
   - Key: `NEXT_PUBLIC_WS_URL`
   - Value: `ws://103.179.172.89:3001`
   - Environment: Production, Preview, Development
5. Save
6. Redeploy your app

## 🔍 Verification

### 1. Check Server Status

```bash
pm2 status
```

Should show `online` status.

### 2. Check Logs

```bash
pm2 logs mt5-websocket
```

Should show connection logs when clients connect.

### 3. Test WebSocket Connection

**From browser console (on your Vercel app):**
```javascript
const socket = io('ws://103.179.172.89:3001');
socket.on('connect', () => console.log('Connected!'));
```

Should log: `Connected!`

### 4. Monitor Connections

```bash
# Watch logs in real-time
pm2 logs mt5-websocket --lines 0

# Check health endpoint
watch -n 1 'curl -s http://localhost:3001/health | jq'
```

## 🔧 Management Commands

### View Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs mt5-websocket
pm2 logs mt5-websocket --lines 100
pm2 logs mt5-websocket --err  # Error logs only
```

### Restart Server
```bash
pm2 restart mt5-websocket
```

### Stop Server
```bash
pm2 stop mt5-websocket
```

### Start Server
```bash
pm2 start mt5-websocket
```

### Delete from PM2
```bash
pm2 delete mt5-websocket
```

### Monitor Resources
```bash
pm2 monit
```

### View Detailed Info
```bash
pm2 info mt5-websocket
```

## 🐛 Troubleshooting

### Server won't start

**Check if port is in use:**
```bash
netstat -tulpn | grep 3001
```

**Kill process using port:**
```bash
kill -9 $(lsof -t -i:3001)
```

**Check Node.js version:**
```bash
node --version  # Should be 18+
```

### Can't connect from external

**Check firewall:**
```bash
ufw status
```

**Test port:**
```bash
telnet 103.179.172.89 3001
```

**Check server is listening:**
```bash
netstat -tulpn | grep 3001
```

Should show:
```
tcp6  0  0  :::3001  :::*  LISTEN  12345/node
```

### CORS errors

**Update ALLOWED_ORIGINS in .env:**
```env
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

**Restart server:**
```bash
pm2 restart mt5-websocket
```

### High memory usage

**Check memory:**
```bash
pm2 info mt5-websocket
```

**Restart server:**
```bash
pm2 restart mt5-websocket
```

**Adjust memory limit in ecosystem.config.js:**
```javascript
max_memory_restart: '500M'  // Increase if needed
```

## 📊 Monitoring

### Real-time Monitoring

```bash
pm2 monit
```

### Check Uptime

```bash
pm2 info mt5-websocket
```

### View Metrics

```bash
pm2 describe mt5-websocket
```

### Export Logs

```bash
pm2 logs mt5-websocket --lines 1000 > websocket-logs.txt
```

## 🔒 Security Best Practices

### 1. Use Environment Variables

Never hardcode sensitive data in code.

### 2. Restrict CORS

Only allow your Vercel app domain:
```env
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### 3. Use Firewall

Only allow necessary ports:
```bash
ufw allow 22/tcp    # SSH
ufw allow 3001/tcp  # WebSocket
ufw enable
```

### 4. Use SSL/TLS (Recommended)

Set up nginx reverse proxy with SSL:
```nginx
server {
    listen 443 ssl;
    server_name ws.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Then use: `wss://ws.yourdomain.com`

### 5. Regular Updates

```bash
# Update dependencies
npm update

# Restart server
pm2 restart mt5-websocket
```

## 🎉 Deployment Complete!

Your WebSocket server is now running on VPS!

**Server URL:** `ws://103.179.172.89:3001`

**Health Check:** `http://103.179.172.89:3001/health`

**Next Steps:**
1. ✅ Update Next.js app to use VPS WebSocket URL
2. ✅ Deploy Next.js app to Vercel
3. ✅ Test connection from Vercel app
4. ✅ Monitor logs and connections

**Useful Commands:**
```bash
# Check status
pm2 status

# View logs
pm2 logs mt5-websocket

# Restart
pm2 restart mt5-websocket

# Monitor
pm2 monit
```

🚀 **Happy Trading!**
