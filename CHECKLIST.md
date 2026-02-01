# ✅ Deployment Checklist

## VPS: 103.179.172.89:10000

---

## 📋 Pre-Deployment

- [ ] VPS Windows có quyền Administrator
- [ ] Node.js đã cài (v18+)
- [ ] pnpm đã cài (`npm install -g pnpm`)
- [ ] Git đã cài (optional)
- [ ] MT5 đã cài và chạy
- [ ] Có Supabase account và project

---

## 🖥️ VPS Setup

### Upload Project
- [ ] Project uploaded to `C:\mt5-trading`
- [ ] File `.env.local` đã tạo với đúng values
- [ ] `PORT=10000` trong `.env.local`

### Install & Build
- [ ] `pnpm install` thành công
- [ ] `pnpm build` thành công
- [ ] Không có errors

### Run Server
- [ ] PM2 đã cài: `npm install -g pm2-windows`
- [ ] Server started: `pm2 start server.js --name mt5-app`
- [ ] PM2 saved: `pm2 save`
- [ ] Status = online: `pm2 status`

### Firewall
- [ ] Windows Firewall port 10000 opened
- [ ] Test từ VPS: `curl http://localhost:10000`
- [ ] Test từ VPS: `curl http://0.0.0.0:10000`

### External Access
- [ ] Test từ máy khác: `curl http://103.179.172.89:10000`
- [ ] Cloud provider firewall/security group đã config (nếu có)

---

## 🤖 EA Bot Setup

### MT5 Configuration
- [ ] EA Bot file `MT5_WebApp_Connector.mq5` đã compile
- [ ] EA Bot settings:
  - [ ] `API_URL = 127.0.0.1:10000/api/mt5`
  - [ ] `API_KEY = your_secure_random_api_key_min_32_chars`
  - [ ] `UPDATE_INTERVAL = 1`

### WebRequest Permission
- [ ] Tools → Options → Expert Advisors
- [ ] "Allow WebRequest for listed URL" checked
- [ ] URL added: `http://127.0.0.1:10000`

### Attach & Test
- [ ] EA Bot attached to chart
- [ ] "Experts" tab shows logs
- [ ] Log shows: `✓ Success! HTTP 200`
- [ ] No errors in log

### Database Check
- [ ] Supabase → `bot_status` table has data
- [ ] Supabase → `account_history` table has data
- [ ] Supabase → `open_positions` table updates

---

## ☁️ Vercel Deployment

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL = http://103.179.172.89:10000`
- [ ] `NEXT_PUBLIC_SUPABASE_URL = https://rkqwppokwrgushngugpv.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...`
- [ ] `MT5_API_KEY = your_secure_random_api_key_min_32_chars`

### Deploy
- [ ] Code pushed to GitHub
- [ ] Vercel project created/imported
- [ ] All environment variables set
- [ ] Deployed successfully
- [ ] No build errors

### Test Vercel App
- [ ] App accessible: `https://your-app.vercel.app`
- [ ] No 404 errors
- [ ] No console errors

---

## 🧪 End-to-End Testing

### Data Flow
- [ ] EA Bot → VPS → Supabase (data writing)
- [ ] Vercel → VPS → Supabase (data reading)
- [ ] Vercel → Supabase Realtime (live updates)

### UI Components
- [ ] Chart displays
- [ ] Chart shows candlesticks
- [ ] Timeframe selector works
- [ ] Symbol search works

### Account Info
- [ ] Balance displays
- [ ] Equity displays
- [ ] Margin displays
- [ ] Values update realtime

### Positions
- [ ] Open positions display
- [ ] Position markers on chart
- [ ] Profit updates every 0.5s
- [ ] Current price line shows

### Trading
- [ ] Place order works
- [ ] Order appears in MT5
- [ ] Order appears in web app
- [ ] Close order works

### Realtime Updates
- [ ] Open position → Updates instantly
- [ ] Close position → Removes instantly
- [ ] Account balance → Updates instantly
- [ ] No delays > 2 seconds

---

## 🔒 Security Check

- [ ] API Key is strong (32+ chars random)
- [ ] API Key same in EA Bot, VPS, Vercel
- [ ] No API keys in public code
- [ ] `.env.local` in `.gitignore`
- [ ] CORS configured for Vercel domain

---

## 📊 Monitoring

- [ ] PM2 status: `pm2 status`
- [ ] PM2 logs: `pm2 logs mt5-app`
- [ ] MT5 Experts tab logs
- [ ] Supabase Dashboard logs
- [ ] Vercel deployment logs

---

## 🐛 Troubleshooting Commands

```bash
# VPS - Check server
pm2 status
pm2 logs mt5-app
netstat -ano | findstr :10000

# VPS - Restart
pm2 restart mt5-app

# Test VPS from outside
curl http://103.179.172.89:10000/api/mt5/bot-status

# Test VPS from inside
curl http://localhost:10000/api/mt5/bot-status

# Vercel - Redeploy
vercel --prod

# Vercel - Check logs
vercel logs
```

---

## ✅ Success Indicators

### VPS
```
✅ Server ready on http://0.0.0.0:10000
✅ Socket.IO ready on ws://0.0.0.0:10000
```

### EA Bot
```
✓ Success! HTTP 200
Sent X bars for BTCUSD H1
📊 Sending X open positions
```

### Vercel
```
✓ Compiled successfully
✓ Ready in Xs
```

### Web App
- Chart shows realtime candles
- Positions update every 0.5s
- No errors in browser console

---

## 📞 Support

If stuck:
1. Check PM2 logs: `pm2 logs mt5-app`
2. Check MT5 Experts tab
3. Check Supabase logs
4. Check Vercel deployment logs
5. Review `SETUP_VPS_103.179.172.89.md`

---

**Status:** [ ] Ready to Deploy

**Date:** _______________

**Deployed by:** _______________

**Notes:**
_______________________________________
_______________________________________
_______________________________________
