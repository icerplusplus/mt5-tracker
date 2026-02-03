# ⚡ Windows VPS - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Connect to VPS
```
Remote Desktop → 103.179.172.89
```

### 2. Upload Files
Copy `websocket-server` folder to: `C:\inetpub\websocket-server`

### 3. Install Dependencies
```powershell
cd C:\inetpub\websocket-server
npm install
```

### 4. Configure
```powershell
copy .env.example .env
notepad .env
```

Update:
```env
PORT=3001
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### 5. Open Firewall (PowerShell as Admin)
```powershell
New-NetFirewallRule -DisplayName "MT5 WebSocket" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### 6. Start Server
```powershell
npm start
```

### 7. Test
Open browser: `http://localhost:3001/health`

---

## 🔧 Windows Firewall - GUI Method

1. Press `Win + R` → Type `wf.msc` → Enter
2. Click **Inbound Rules** → **New Rule...**
3. Select **Port** → Next
4. **TCP** + Port `3001` → Next
5. **Allow the connection** → Next
6. Check all profiles → Next
7. Name: `MT5 WebSocket` → Finish

---

## 📊 Check Status

### Is server running?
```powershell
netstat -ano | findstr :3001
```

### Is firewall open?
```powershell
Get-NetFirewallRule -DisplayName "MT5 WebSocket"
```

### Test from external
```
http://103.179.172.89:3001/health
```

---

## 🔄 Restart Server

### If using PM2:
```powershell
pm2 restart mt5-websocket
```

### If using Node directly:
```powershell
# Press Ctrl+C to stop
# Then run again:
npm start
```

### If using Windows Service:
```powershell
net stop "MT5 WebSocket Server"
net start "MT5 WebSocket Server"
```

---

## 🐛 Troubleshooting

### Port already in use?
```powershell
# Find process
netstat -ano | findstr :3001

# Kill process (replace <PID> with actual PID)
taskkill /F /PID <PID>
```

### Can't connect from external?
```powershell
# Check firewall
Get-NetFirewallRule -DisplayName "MT5 WebSocket"

# Test port
Test-NetConnection -ComputerName 103.179.172.89 -Port 3001
```

### Server crashed?
```powershell
# Check logs (if using PM2)
pm2 logs mt5-websocket

# Or check Windows Event Viewer
eventvwr
```

---

## 🎯 Production Setup (Auto-start on boot)

### Option 1: PM2
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
pm2 start server.js --name mt5-websocket
pm2 save
```

### Option 2: Windows Service
```powershell
npm install -g node-windows
# Create install-service.js (see DEPLOYMENT_WINDOWS.md)
node install-service.js
```

### Option 3: Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: **When computer starts**
4. Action: Start program
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `C:\inetpub\websocket-server\server.js`
   - Start in: `C:\inetpub\websocket-server`

---

## ✅ Checklist

- [ ] Node.js installed
- [ ] Files uploaded to `C:\inetpub\websocket-server`
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` configured
- [ ] Firewall rule created (port 3001)
- [ ] Server started
- [ ] Health check working (`http://localhost:3001/health`)
- [ ] External access working (`http://103.179.172.89:3001/health`)
- [ ] Auto-start configured (PM2/Service/Task Scheduler)

---

## 🔗 Update Next.js App

### Local Development
```env
# .env.local
NEXT_PUBLIC_WS_URL=ws://103.179.172.89:3001
```

### Vercel Production
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Add: `NEXT_PUBLIC_WS_URL` = `ws://103.179.172.89:3001`
4. Redeploy

---

## 📚 Full Documentation

- **Complete Guide**: `DEPLOYMENT_WINDOWS.md`
- **Integration**: `INTEGRATION.md`
- **README**: `README.md`

---

## 🎉 Done!

WebSocket server is running on Windows VPS!

**Test it:**
```
http://103.179.172.89:3001/health
```

**Connect from app:**
```javascript
const socket = io('ws://103.179.172.89:3001');
```

🚀 **Ready for production!**
