# MT5 WebSocket Server

Standalone WebSocket server for MT5 Trading Dashboard realtime updates.

## 🎯 Purpose

This server handles WebSocket connections for realtime data broadcasting:
- Position updates
- Account info updates
- Chart data updates
- Tick data updates
- Bot status updates

## 📋 Prerequisites

- Node.js 18+ installed
- PM2 installed globally (optional, for production)
- Port 3001 available (or configure different port)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd websocket-server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Update `.env` with your configuration:
```env
PORT=3001
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
SUPABASE_URL=https://rkqwppokwrgushngugpv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MT5_API_KEY=your_api_key
```

### 3. Run Server

**Development (Simple - No PM2):**
```bash
node server.js
```

Or use the start script:
```bash
.\start-server.ps1  # Windows PowerShell
```

**Development (with auto-reload):**
```bash
npm run dev
```

**Production (with PM2):**
```bash
npm run pm2:start
```

**Note:** For VPS, you can run directly with `node server.js` without PM2. Just keep the terminal/SSH session open. Press `Ctrl+C` to stop.

## 📊 Server Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "service": "MT5 WebSocket Server",
  "uptime": 123.45,
  "connections": 2,
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

### WebSocket Connection
```javascript
const socket = io('ws://localhost:3001');
```

## 🔌 WebSocket Events

### Client → Server

**Subscribe to channel:**
```javascript
socket.emit('subscribe', 'positions');
```

**Unsubscribe from channel:**
```javascript
socket.emit('unsubscribe', 'positions');
```

### Server → Client

**Position updates:**
```javascript
socket.on('positions:update', (positions) => {
  console.log('Positions:', positions);
});
```

**Account updates:**
```javascript
socket.on('account:update', (accountInfo) => {
  console.log('Account:', accountInfo);
});
```

**Tick updates:**
```javascript
socket.on('tick:update', (tick) => {
  console.log('Tick:', tick);
});
```

**Chart updates:**
```javascript
socket.on('chart:update', (bar) => {
  console.log('Chart bar:', bar);
});
```

**Bot status:**
```javascript
socket.on('bot:status', (status) => {
  console.log('Bot status:', status);
});
```

**New trade:**
```javascript
socket.on('trade:new', (trade) => {
  console.log('New trade:', trade);
});
```

## 🔧 Server Management

### Running Without PM2 (Simple)

**Start server:**
```powershell
cd websocket-server
node server.js
```

**Stop server:**
- Press `Ctrl+C` in the terminal

**Restart server:**
- Press `Ctrl+C` to stop
- Run `node server.js` again

**View logs:**
- Logs are displayed directly in the terminal

**Pros:**
- ✅ Simple and straightforward
- ✅ Easy to debug (logs in real-time)
- ✅ No additional dependencies

**Cons:**
- ❌ Server stops when terminal closes
- ❌ No auto-restart on crash
- ❌ Manual restart required

### Running With PM2 (Production)

### Start server
```bash
npm run pm2:start
# or
pm2 start ecosystem.config.js
```

### Stop server
```bash
npm run pm2:stop
# or
pm2 stop mt5-websocket
```

### Restart server
```bash
npm run pm2:restart
# or
pm2 restart mt5-websocket
```

### View logs
```bash
npm run pm2:logs
# or
pm2 logs mt5-websocket
```

### View status
```bash
pm2 status
```

### Delete from PM2
```bash
npm run pm2:delete
# or
pm2 delete mt5-websocket
```

### Save PM2 config (auto-start on reboot)
```bash
pm2 save
pm2 startup
```

## 📁 Project Structure

```
websocket-server/
├── server.js              # Main server file
├── package.json           # Dependencies
├── ecosystem.config.js    # PM2 configuration
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── README.md             # This file
└── logs/                 # PM2 logs (auto-created)
    ├── error.log
    └── out.log
```

## 🌐 VPS Deployment

### 1. Upload to VPS

```bash
# From local machine
scp -r websocket-server root@103.179.172.89:/root/
```

Or use Git:
```bash
# On VPS
cd /root
git clone <your-repo>
cd websocket-server
```

### 2. Install Dependencies

```bash
cd /root/websocket-server
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Update with production values:
```env
PORT=3001
HOST=0.0.0.0
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### 4. Install PM2 (if not installed)

```bash
npm install -g pm2
```

### 5. Start Server

```bash
npm run pm2:start
```

### 6. Save PM2 Config (auto-start on reboot)

```bash
pm2 save
pm2 startup
```

### 7. Configure Firewall

```bash
# Allow port 3001
ufw allow 3001/tcp
ufw reload
```

### 8. Test Connection

```bash
# From local machine
curl http://103.179.172.89:3001/health
```

## 🔒 Security

### Firewall Rules

Only allow connections from:
- Your Vercel app domain
- Your local development machine
- EA Bot (if on different server)

### Environment Variables

Never commit `.env` file to Git!

### CORS Configuration

Update `ALLOWED_ORIGINS` in `.env` to restrict access:
```env
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

## 📊 Monitoring

### Check server status
```bash
pm2 status
```

### View logs
```bash
pm2 logs mt5-websocket
```

### Monitor resources
```bash
pm2 monit
```

### View detailed info
```bash
pm2 info mt5-websocket
```

## 🐛 Troubleshooting

### Server won't start

**Check port availability:**
```bash
netstat -tulpn | grep 3001
```

**Check logs:**
```bash
pm2 logs mt5-websocket --lines 100
```

### Clients can't connect

**Check firewall:**
```bash
ufw status
```

**Check CORS settings:**
- Verify `ALLOWED_ORIGINS` in `.env`
- Check client WebSocket URL

**Test connection:**
```bash
curl http://103.179.172.89:3001/health
```

### High memory usage

**Restart server:**
```bash
pm2 restart mt5-websocket
```

**Check memory limit:**
- Edit `ecosystem.config.js`
- Adjust `max_memory_restart`

## 📝 Notes

### Port Configuration

Default port: **3001**

To change:
1. Update `PORT` in `.env`
2. Update firewall rules
3. Update client `NEXT_PUBLIC_WS_URL`
4. Restart server

### Multiple Instances

For high traffic, run multiple instances:

Edit `ecosystem.config.js`:
```javascript
instances: 2, // or 'max' for all CPU cores
exec_mode: 'cluster'
```

### SSL/TLS (WSS)

For secure WebSocket (wss://), use nginx reverse proxy:

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
        proxy_set_header Host $host;
    }
}
```

## 🎉 Done!

WebSocket server is now running on your VPS!

**Next steps:**
1. Update Next.js app `NEXT_PUBLIC_WS_URL` to point to VPS
2. Deploy Next.js app to Vercel
3. Test connection from Vercel app

**VPS WebSocket URL:**
```
ws://103.179.172.89:3001
```

Or with domain:
```
wss://ws.yourdomain.com
```
