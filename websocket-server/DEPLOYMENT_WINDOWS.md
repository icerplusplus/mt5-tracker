# 🚀 Deployment Guide - Windows VPS

## 📋 Prerequisites

- Windows VPS: 103.179.172.89
- Remote Desktop access
- Node.js 18+ installed
- PM2 installed (or use Windows Service)

---

## 🎯 Deployment Steps

### Step 1: Connect to Windows VPS

**Using Remote Desktop:**
1. Open Remote Desktop Connection
2. Computer: `103.179.172.89`
3. Enter username and password
4. Click Connect

### Step 2: Install Node.js (if not installed)

**Download and Install:**
1. Open browser on VPS
2. Go to: https://nodejs.org/
3. Download LTS version (Windows Installer .msi)
4. Run installer
5. Follow installation wizard
6. Check "Add to PATH" option

**Verify Installation:**
```powershell
node --version
npm --version
```

### Step 3: Install PM2 (Optional)

**Using npm:**
```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# Setup PM2 as Windows Service
pm2-startup install
```

**Or use Windows Service directly (see Step 8)**

### Step 4: Upload WebSocket Server

**Option A: Using Remote Desktop**
1. Copy `websocket-server` folder from local machine
2. Paste to VPS (e.g., `C:\inetpub\websocket-server`)

**Option B: Using Git**
```powershell
cd C:\inetpub
git clone https://github.com/icerplusplus/mt5-tracker.git
cd mt5-tracker\websocket-server
```

**Option C: Using FTP/SFTP**
- Use FileZilla or WinSCP
- Upload `websocket-server` folder

### Step 5: Install Dependencies

```powershell
cd C:\inetpub\websocket-server
npm install
```

Expected output:
```
added 50 packages in 5s
```

### Step 6: Configure Environment

**Create .env file:**
```powershell
copy .env.example .env
notepad .env
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

Save and close.

### Step 7: Configure Windows Firewall

**Method 1: Using PowerShell (Recommended)**

Open PowerShell as Administrator:
```powershell
# Allow inbound connections on port 3001
New-NetFirewallRule -DisplayName "MT5 WebSocket Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Verify rule was created
Get-NetFirewallRule -DisplayName "MT5 WebSocket Server"
```

**Method 2: Using GUI**

1. Open **Windows Defender Firewall with Advanced Security**
   - Press `Win + R`
   - Type: `wf.msc`
   - Press Enter

2. Click **Inbound Rules** in left panel

3. Click **New Rule...** in right panel

4. Select **Port** → Click Next

5. Select **TCP** and **Specific local ports**: `3001` → Click Next

6. Select **Allow the connection** → Click Next

7. Check all profiles (Domain, Private, Public) → Click Next

8. Name: `MT5 WebSocket Server` → Click Finish

**Verify Firewall Rule:**
```powershell
Get-NetFirewallRule -DisplayName "MT5 WebSocket Server" | Format-List
```

### Step 8: Start Server

**Option A: Using PM2 (Recommended)**

```powershell
cd C:\inetpub\websocket-server

# Start server
pm2 start server.js --name mt5-websocket

# Save PM2 config
pm2 save

# Setup auto-start
pm2 startup
```

**Option B: Using Node directly**

```powershell
cd C:\inetpub\websocket-server
node server.js
```

**Option C: Using Windows Service (Production)**

Install `node-windows`:
```powershell
npm install -g node-windows
```

Create service script `install-service.js`:
```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'MT5 WebSocket Server',
  description: 'WebSocket server for MT5 Trading Dashboard',
  script: 'C:\\inetpub\\websocket-server\\server.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: {
    name: "NODE_ENV",
    value: "production"
  }
});

svc.on('install', function(){
  console.log('Service installed!');
  svc.start();
});

svc.install();
```

Install service:
```powershell
node install-service.js
```

**Manage Windows Service:**
```powershell
# Start service
net start "MT5 WebSocket Server"

# Stop service
net stop "MT5 WebSocket Server"

# Check status
sc query "MT5 WebSocket Server"
```

### Step 9: Verify Server is Running

**Check if server is listening:**
```powershell
netstat -ano | findstr :3001
```

Expected output:
```
TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING       12345
```

**Test health endpoint:**
```powershell
curl http://localhost:3001/health
```

Or open browser:
```
http://localhost:3001/health
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

### Step 10: Test from External

**From your local machine:**
```powershell
curl http://103.179.172.89:3001/health
```

Or open browser:
```
http://103.179.172.89:3001/health
```

Should return the same JSON response.

---

## 🔍 Verification

### 1. Check Server Process

**Using Task Manager:**
1. Press `Ctrl + Shift + Esc`
2. Go to **Details** tab
3. Look for `node.exe` process

**Using PowerShell:**
```powershell
Get-Process -Name node
```

### 2. Check Port

```powershell
netstat -ano | findstr :3001
```

### 3. Check Firewall Rule

```powershell
Get-NetFirewallRule -DisplayName "MT5 WebSocket Server"
```

### 4. Test Connection

**From VPS:**
```powershell
Test-NetConnection -ComputerName localhost -Port 3001
```

**From external:**
```powershell
Test-NetConnection -ComputerName 103.179.172.89 -Port 3001
```

---

## 🔧 Management Commands

### Using PM2

```powershell
# View status
pm2 status

# View logs
pm2 logs mt5-websocket

# Restart
pm2 restart mt5-websocket

# Stop
pm2 stop mt5-websocket

# Start
pm2 start mt5-websocket

# Delete
pm2 delete mt5-websocket
```

### Using Windows Service

```powershell
# Start service
net start "MT5 WebSocket Server"

# Stop service
net stop "MT5 WebSocket Server"

# Restart service
net stop "MT5 WebSocket Server"
net start "MT5 WebSocket Server"

# Check status
sc query "MT5 WebSocket Server"

# View service details
Get-Service "MT5 WebSocket Server"
```

### Using Task Scheduler (Alternative)

Create a scheduled task to run on startup:
1. Open Task Scheduler
2. Create Basic Task
3. Name: `MT5 WebSocket Server`
4. Trigger: **When the computer starts**
5. Action: **Start a program**
6. Program: `C:\Program Files\nodejs\node.exe`
7. Arguments: `C:\inetpub\websocket-server\server.js`
8. Start in: `C:\inetpub\websocket-server`

---

## 🐛 Troubleshooting

### Server won't start

**Check if port is in use:**
```powershell
netstat -ano | findstr :3001
```

**Kill process using port:**
```powershell
# Get PID from netstat output
taskkill /F /PID <PID>
```

**Check Node.js version:**
```powershell
node --version  # Should be 18+
```

### Can't connect from external

**Check firewall rule:**
```powershell
Get-NetFirewallRule -DisplayName "MT5 WebSocket Server"
```

**Test port:**
```powershell
Test-NetConnection -ComputerName 103.179.172.89 -Port 3001
```

**Check if server is listening on all interfaces:**
```powershell
netstat -ano | findstr :3001
```

Should show `0.0.0.0:3001` not `127.0.0.1:3001`

**Check Windows Firewall is enabled:**
```powershell
Get-NetFirewallProfile | Select-Object Name, Enabled
```

### CORS errors

**Update ALLOWED_ORIGINS in .env:**
```env
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

**Restart server:**
```powershell
pm2 restart mt5-websocket
# or
net stop "MT5 WebSocket Server"
net start "MT5 WebSocket Server"
```

### High memory usage

**Check memory:**
```powershell
Get-Process -Name node | Select-Object Name, CPU, WorkingSet
```

**Restart server:**
```powershell
pm2 restart mt5-websocket
```

---

## 📊 Monitoring

### Using PM2

```powershell
# Real-time monitoring
pm2 monit

# View logs
pm2 logs mt5-websocket --lines 100

# View metrics
pm2 describe mt5-websocket
```

### Using Windows Performance Monitor

1. Open Performance Monitor (`perfmon`)
2. Add counters for `node.exe` process
3. Monitor CPU, Memory, Network

### Using PowerShell

```powershell
# Monitor process
while ($true) {
    Get-Process -Name node | Select-Object Name, CPU, WorkingSet
    Start-Sleep -Seconds 5
}

# Monitor port
while ($true) {
    netstat -ano | findstr :3001
    Start-Sleep -Seconds 5
}
```

---

## 🔒 Security Best Practices

### 1. Windows Firewall

Only allow port 3001:
```powershell
# Remove rule if needed
Remove-NetFirewallRule -DisplayName "MT5 WebSocket Server"

# Add rule with specific remote addresses (optional)
New-NetFirewallRule -DisplayName "MT5 WebSocket Server" `
  -Direction Inbound `
  -LocalPort 3001 `
  -Protocol TCP `
  -Action Allow `
  -RemoteAddress @("your-vercel-ip-range")
```

### 2. Use Environment Variables

Never hardcode sensitive data in code.

### 3. Restrict CORS

Only allow your Vercel app domain:
```env
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### 4. Regular Updates

```powershell
# Update dependencies
npm update

# Restart server
pm2 restart mt5-websocket
```

---

## 📝 Useful PowerShell Commands

### Network

```powershell
# Check listening ports
netstat -ano | findstr LISTENING

# Test connection
Test-NetConnection -ComputerName 103.179.172.89 -Port 3001

# Get firewall rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*MT5*"}
```

### Process Management

```powershell
# Find Node.js processes
Get-Process -Name node

# Kill process by PID
Stop-Process -Id <PID> -Force

# Kill all Node.js processes
Get-Process -Name node | Stop-Process -Force
```

### Service Management

```powershell
# List all services
Get-Service | Where-Object {$_.Name -like "*MT5*"}

# Start service
Start-Service "MT5 WebSocket Server"

# Stop service
Stop-Service "MT5 WebSocket Server"

# Restart service
Restart-Service "MT5 WebSocket Server"
```

---

## 🎉 Deployment Complete!

Your WebSocket server is now running on Windows VPS!

**Server URL:** `ws://103.179.172.89:3001`

**Health Check:** `http://103.179.172.89:3001/health`

**Next Steps:**
1. ✅ Update Next.js app to use VPS WebSocket URL
2. ✅ Deploy Next.js app to Vercel
3. ✅ Test connection from Vercel app
4. ✅ Monitor logs and connections

**Useful Commands:**
```powershell
# Check status (PM2)
pm2 status

# Check status (Windows Service)
sc query "MT5 WebSocket Server"

# View logs (PM2)
pm2 logs mt5-websocket

# Test health
curl http://localhost:3001/health

# Check port
netstat -ano | findstr :3001
```

🚀 **Happy Trading!**
