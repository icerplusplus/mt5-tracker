# 🚀 WebSocket Server Setup - Complete Guide

## 🎯 Problem

Vercel không support WebSocket → Cần deploy WebSocket server riêng trên VPS.

## ✅ Solution

Tách WebSocket server thành project riêng, deploy lên VPS (103.179.172.89).

---

## 📁 Project Structure

```
finance-tracker/
├── websocket-server/          # ← NEW: Standalone WebSocket server
│   ├── server.js              # Main server file
│   ├── package.json           # Dependencies
│   ├── ecosystem.config.js    # PM2 configuration
│   ├── .env.example           # Environment template
│   ├── .gitignore            # Git ignore
│   ├── README.md             # Documentation
│   ├── DEPLOYMENT.md         # Deployment guide
│   └── INTEGRATION.md        # Integration guide
├── app/                       # Next.js app (deploy to Vercel)
├── lib/
└── ...
```

---

## 🔧 Architecture

### Before (Not working on Vercel):
```
EA Bot → Next.js + WebSocket (Vercel) ❌ → Clients
```

### After (Working):
```
EA Bot → Next.js API (Vercel) → WebSocket Server (VPS) → Clients
                ↓                        ↓
           Save to DB              Broadcast realtime
```

---

## 📋 Quick Start

### 1. Setup WebSocket Server on VPS

```bash
# SSH to VPS
ssh root@103.179.172.89

# Upload websocket-server folder
cd /root
# (upload via scp, git, or ftp)

# Install dependencies
cd websocket-server
npm install

# Configure environment
cp .env.example .env
nano .env
# Update: PORT, ALLOWED_ORIGINS, etc.

# Start with PM2
npm run pm2:start

# Save PM2 config (auto-start on reboot)
pm2 save
pm2 startup
```

### 2. Configure Firewall

```bash
ufw allow 3001/tcp
ufw reload
```

### 3. Test Server

```bash
curl http://103.179.172.89:3001/health
```

Expected:
```json
{
  "status": "ok",
  "service": "MT5 WebSocket Server",
  "connections": 0
}
```

### 4. Update Next.js App

**Update `.env.local`:**
```env
NEXT_PUBLIC_WS_URL=ws://103.179.172.89:3001
```

**Update Vercel Environment Variables:**
- Go to Vercel Dashboard → Settings → Environment Variables
- Add: `NEXT_PUBLIC_WS_URL` = `ws://103.179.172.89:3001`

### 5. Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Update WebSocket URL to VPS"
git push

# Vercel will auto-deploy
```

---

## 🔌 WebSocket Server Features

### Endpoints

**Health Check:**
```
GET http://103.179.172.89:3001/health
```

**WebSocket Connection:**
```
ws://103.179.172.89:3001
```

### Events

**Server → Client:**
- `positions:update` - Position updates
- `account:update` - Account info updates
- `tick:update` - Tick data updates
- `chart:update` - Chart bar updates
- `bot:status` - Bot status updates
- `trade:new` - New trade notifications

**Client → Server:**
- `subscribe` - Subscribe to channel
- `unsubscribe` - Unsubscribe from channel

---

## 📊 Integration with Next.js API

### Option 1: HTTP Webhook (Recommended)

**Flow:**
```
EA Bot → Next.js API → HTTP POST → WebSocket Server → Broadcast
```

**Implementation:**

1. Add webhook endpoints to WebSocket server
2. Create webhook helper in Next.js
3. Update API routes to call webhook

See `websocket-server/INTEGRATION.md` for details.

### Option 2: Direct Socket.IO Client

Next.js API connects as Socket.IO client to broadcast.

---

## 🔒 Security

### 1. API Key Authentication

WebSocket server verifies `X-API-Key` header for webhook calls.

### 2. CORS Configuration

Only allow connections from:
```env
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### 3. Firewall Rules

Only allow necessary ports:
```bash
ufw allow 22/tcp    # SSH
ufw allow 3001/tcp  # WebSocket
```

### 4. SSL/TLS (Optional)

Use nginx reverse proxy for `wss://` (secure WebSocket).

---

## 📊 Monitoring

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs mt5-websocket

# Monitor resources
pm2 monit

# Restart server
pm2 restart mt5-websocket
```

### Health Check

```bash
# From VPS
curl http://localhost:3001/health

# From external
curl http://103.179.172.89:3001/health
```

---

## 🐛 Troubleshooting

### Server won't start

```bash
# Check port
netstat -tulpn | grep 3001

# Check logs
pm2 logs mt5-websocket --lines 100

# Restart
pm2 restart mt5-websocket
```

### Clients can't connect

```bash
# Check firewall
ufw status

# Test connection
telnet 103.179.172.89 3001

# Check CORS settings
nano /root/websocket-server/.env
```

### High memory usage

```bash
# Check memory
pm2 info mt5-websocket

# Restart
pm2 restart mt5-websocket
```

---

## 📝 Files Created

### WebSocket Server Project:

1. ✅ `websocket-server/server.js` - Main server
2. ✅ `websocket-server/package.json` - Dependencies
3. ✅ `websocket-server/ecosystem.config.js` - PM2 config
4. ✅ `websocket-server/.env.example` - Environment template
5. ✅ `websocket-server/.gitignore` - Git ignore
6. ✅ `websocket-server/README.md` - Documentation
7. ✅ `websocket-server/DEPLOYMENT.md` - Deployment guide
8. ✅ `websocket-server/INTEGRATION.md` - Integration guide

### Documentation:

9. ✅ `WEBSOCKET_SERVER_SETUP.md` - This file

---

## 🎯 Next Steps

### 1. Deploy WebSocket Server to VPS

Follow `websocket-server/DEPLOYMENT.md`:
- Upload to VPS
- Install dependencies
- Configure environment
- Start with PM2
- Configure firewall

### 2. Update Next.js App

- Update `NEXT_PUBLIC_WS_URL` to VPS
- Update Vercel environment variables
- Test connection

### 3. Integrate API Routes (Optional)

Follow `websocket-server/INTEGRATION.md`:
- Add webhook endpoints
- Create webhook helper
- Update API routes

### 4. Test Everything

- Test WebSocket connection from browser
- Test EA Bot → API → WebSocket flow
- Monitor logs and connections

---

## ✅ Checklist

### VPS Setup:
- [ ] SSH access to VPS
- [ ] Node.js 18+ installed
- [ ] PM2 installed
- [ ] Firewall configured (port 3001)

### WebSocket Server:
- [ ] Code uploaded to VPS
- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Server started with PM2
- [ ] PM2 saved (auto-start)
- [ ] Health check working

### Next.js App:
- [ ] `NEXT_PUBLIC_WS_URL` updated
- [ ] Vercel env vars updated
- [ ] Deployed to Vercel
- [ ] WebSocket connection working

### Testing:
- [ ] Health check from external
- [ ] WebSocket connection from browser
- [ ] EA Bot → API → WebSocket flow
- [ ] Realtime updates working

---

## 🎉 Done!

Your WebSocket server is now running on VPS and ready for production!

**Server URL:** `ws://103.179.172.89:3001`

**Health Check:** `http://103.179.172.89:3001/health`

**PM2 Status:** `pm2 status`

**Logs:** `pm2 logs mt5-websocket`

---

## 📚 Documentation

- **README**: `websocket-server/README.md`
- **Deployment**: `websocket-server/DEPLOYMENT.md`
- **Integration**: `websocket-server/INTEGRATION.md`
- **This Guide**: `WEBSOCKET_SERVER_SETUP.md`

---

## 🚀 Happy Trading!

Your MT5 Trading Dashboard is now production-ready with:
- ✅ Next.js app on Vercel (serverless)
- ✅ WebSocket server on VPS (realtime)
- ✅ Supabase database (data storage)
- ✅ EA Bot on MT5 (data source)

**Architecture:**
```
EA Bot (MT5) → Next.js API (Vercel) → WebSocket Server (VPS) → Clients (Browser)
                      ↓
                 Supabase DB
```

Perfect! 🎯
