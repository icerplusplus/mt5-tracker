# Kiến Trúc Hệ Thống: Vercel + VPS + MT5

## Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐              ┌─────────────────┐
│     Vercel      │              │   Windows VPS   │
│   (Web App)     │              │                 │
│                 │              │  Public IP:     │
│ - Next.js UI    │              │  203.0.113.45   │
│ - React         │              │                 │
│ - Tailwind CSS  │              │  Port: 4000     │
└────────┬────────┘              └────────┬────────┘
         │                                │
         │ HTTPS                          │
         │                                │
         ▼                                ▼
┌─────────────────────────────────────────────────┐
│              Supabase Cloud                     │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         PostgreSQL Database              │  │
│  │                                          │  │
│  │  Tables:                                 │  │
│  │  - account_history                       │  │
│  │  - open_positions                        │  │
│  │  - bot_status                            │  │
│  │  - trades                                │  │
│  │  - chart_data                            │  │
│  │  - commands                              │  │
│  │  - subscriptions                         │  │
│  │  - statistics                            │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Realtime Subscriptions           │  │
│  │  - WebSocket connections                 │  │
│  │  - Postgres CDC (Change Data Capture)   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Chi Tiết VPS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Windows VPS                                │
│                   (203.0.113.45:4000)                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Node.js API Server (Express)                 │ │
│  │                   Port: 4000                              │ │
│  │                                                           │ │
│  │  Endpoints:                                               │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ POST /api/mt5/account-info    (from EA Bot)        │ │ │
│  │  │ POST /api/mt5/positions        (from EA Bot)        │ │ │
│  │  │ POST /api/mt5/bot-status       (from EA Bot)        │ │ │
│  │  │ POST /api/mt5/tick-data        (from EA Bot)        │ │ │
│  │  │ POST /api/mt5/chart-data       (from EA Bot)        │ │ │
│  │  │ GET  /api/mt5/commands         (from EA Bot)        │ │ │
│  │  │ POST /api/mt5/commands         (from EA Bot)        │ │ │
│  │  ├─────────────────────────────────────────────────────┤ │ │
│  │  │ GET  /api/mt5/account-info     (from Vercel)        │ │ │
│  │  │ GET  /api/mt5/positions        (from Vercel)        │ │ │
│  │  │ GET  /api/mt5/bot-status       (from Vercel)        │ │ │
│  │  │ GET  /api/mt5/chart-data       (from Vercel)        │ │ │
│  │  │ GET  /api/mt5/trades           (from Vercel)        │ │ │
│  │  │ POST /api/commands/*           (from Vercel)        │ │ │
│  │  │ GET  /api/subscriptions        (from Vercel)        │ │ │
│  │  │ POST /api/subscriptions        (from Vercel)        │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  Security:                                                │ │
│  │  - API Key authentication (X-API-Key header)             │ │
│  │  - CORS whitelist (Vercel domains)                       │ │
│  │  - Rate limiting (100 req/min)                           │ │
│  └───────────────────┬───────────────────────────────────────┘ │
│                      │                                         │
│                      │ localhost:4000                          │
│                      │                                         │
│  ┌───────────────────▼───────────────────────────────────────┐ │
│  │              MetaTrader 5 Terminal                        │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │         MT5_WebApp_Connector.mq5 (EA Bot)          │ │ │
│  │  │                                                     │ │ │
│  │  │  Functions:                                         │ │ │
│  │  │  - SendAccountInfo()      → POST /account-info     │ │ │
│  │  │  - SendOpenPositions()    → POST /positions        │ │ │
│  │  │  - SendBotStatus()        → POST /bot-status       │ │ │
│  │  │  - SendTickData()         → POST /tick-data        │ │ │
│  │  │  - SendChartData()        → POST /chart-data       │ │ │
│  │  │  - CheckCommands()        → GET  /commands         │ │ │
│  │  │  - ReportCommandResult()  → POST /commands         │ │ │
│  │  │                                                     │ │ │
│  │  │  Timers:                                            │ │ │
│  │  │  - Tick data: Every 1 second                       │ │ │
│  │  │  - Positions: Every 0.5 seconds                    │ │ │
│  │  │  - Account info: Every 1 second                    │ │ │
│  │  │  - Chart data: Every 5 seconds                     │ │ │
│  │  │  - Commands check: Every 2 seconds                 │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. EA Bot → Supabase (Write Data)

```
┌──────────────┐
│  MT5 EA Bot  │
│  (on VPS)    │
└──────┬───────┘
       │
       │ 1. POST /api/mt5/account-info
       │    { balance, equity, margin, ... }
       │
       ▼
┌──────────────┐
│  Node.js API │
│  (localhost) │
└──────┬───────┘
       │
       │ 2. INSERT INTO account_history
       │    VALUES (...)
       │
       ▼
┌──────────────┐
│   Supabase   │
│   Database   │
└──────────────┘
```

### 2. Vercel → Supabase (Read Data)

```
┌──────────────┐
│ Vercel App   │
│ (Browser)    │
└──────┬───────┘
       │
       │ 1. GET /api/mt5/account-info
       │    Headers: X-API-Key
       │
       ▼
┌──────────────┐
│  VPS API     │
│  (Public IP) │
└──────┬───────┘
       │
       │ 2. SELECT * FROM account_history
       │    ORDER BY timestamp DESC LIMIT 1
       │
       ▼
┌──────────────┐
│   Supabase   │
│   Database   │
└──────┬───────┘
       │
       │ 3. Return data
       │
       ▼
┌──────────────┐
│ Vercel App   │
│ (Display)    │
└──────────────┘
```

### 3. Vercel → EA Bot (Send Command)

```
┌──────────────┐
│ Vercel App   │
│ (User clicks │
│ "Place Order"│
└──────┬───────┘
       │
       │ 1. POST /api/commands/place-order
       │    { symbol, type, volume, sl, tp }
       │
       ▼
┌──────────────┐
│  VPS API     │
└──────┬───────┘
       │
       │ 2. INSERT INTO commands
       │    VALUES (PLACE_ORDER, PENDING, ...)
       │
       ▼
┌──────────────┐
│   Supabase   │
└──────────────┘
       │
       │ 3. EA Bot polls every 2 seconds
       │    GET /api/mt5/commands
       │
       ▼
┌──────────────┐
│  MT5 EA Bot  │
│              │
│ 4. Execute   │
│    PlaceOrder│
└──────┬───────┘
       │
       │ 5. POST /api/mt5/commands
       │    { command_id, status: EXECUTED }
       │
       ▼
┌──────────────┐
│   Supabase   │
│   (Update)   │
└──────────────┘
```

### 4. Realtime Updates (Supabase → Vercel)

```
┌──────────────┐
│  MT5 EA Bot  │
└──────┬───────┘
       │
       │ 1. POST /api/mt5/positions
       │    (New position opened)
       │
       ▼
┌──────────────┐
│   Supabase   │
│   Database   │
└──────┬───────┘
       │
       │ 2. Postgres CDC triggers
       │    Realtime notification
       │
       ▼
┌──────────────┐
│   Supabase   │
│   Realtime   │
│   (WebSocket)│
└──────┬───────┘
       │
       │ 3. Push update to subscribers
       │
       ▼
┌──────────────┐
│ Vercel App   │
│ (Browser)    │
│              │
│ 4. Update UI │
│    instantly │
└──────────────┘
```

---

## Network Ports

| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| VPS API Server | 4000 | HTTP | Public (Vercel + EA Bot) |
| Supabase | 443 | HTTPS | Public (Vercel + VPS) |
| Supabase Realtime | 443 | WSS | Public (Vercel) |
| MT5 Terminal | - | - | Local only |

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: API Key Authentication                            │
│  ├─ All requests require X-API-Key header                  │
│  ├─ Key must match MT5_API_KEY in .env                     │
│  └─ 401 Unauthorized if missing/invalid                    │
│                                                             │
│  Layer 2: CORS Protection                                   │
│  ├─ Only allow Vercel domains                              │
│  ├─ Block requests from unknown origins                    │
│  └─ Credentials: true for cookies                          │
│                                                             │
│  Layer 3: Rate Limiting                                     │
│  ├─ Max 100 requests per minute per IP                     │
│  ├─ Prevents DDoS attacks                                  │
│  └─ Returns 429 Too Many Requests                          │
│                                                             │
│  Layer 4: Firewall                                          │
│  ├─ Windows Firewall blocks unauthorized ports             │
│  ├─ Cloud provider security groups                         │
│  └─ Only port 4000 exposed                                 │
│                                                             │
│  Layer 5: HTTPS (Optional but Recommended)                  │
│  ├─ Caddy reverse proxy with auto SSL                      │
│  ├─ Encrypts data in transit                               │
│  └─ Prevents man-in-the-middle attacks                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Checklist

### VPS Setup
- [x] Node.js installed
- [x] Project uploaded
- [x] Dependencies installed (`npm install`)
- [x] `.env` file configured
- [x] API server running (`pm2 start vps-server.js`)
- [x] Firewall port 4000 opened
- [x] Cloud provider port 4000 opened
- [x] Public IP accessible

### EA Bot Setup
- [x] MT5 installed on VPS
- [x] EA Bot compiled
- [x] API_URL = `127.0.0.1:4000/api/mt5`
- [x] API_KEY matches VPS
- [x] WebRequest allowed for `http://127.0.0.1:4000`
- [x] EA Bot attached to chart
- [x] Logs show "✓ Success! HTTP 200"

### Vercel Setup
- [x] Code pushed to GitHub
- [x] Vercel project created
- [x] Environment variables set
- [x] `NEXT_PUBLIC_VPS_API_URL` = `http://VPS_IP:4000`
- [x] Deployed successfully
- [x] Web app accessible
- [x] Realtime updates working

### Testing
- [x] VPS health check: `curl http://VPS_IP:4000/health`
- [x] EA Bot sending data to Supabase
- [x] Vercel fetching data from VPS
- [x] Commands working (place order, close order)
- [x] Realtime subscriptions active

---

## Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| API Response Time | < 200ms | ~50-100ms |
| Tick Data Frequency | 1 second | 1 second |
| Position Updates | 0.5 seconds | 0.5 seconds |
| Chart Data Updates | 5 seconds | 5 seconds |
| Command Execution | < 2 seconds | ~1-2 seconds |
| Realtime Latency | < 500ms | ~100-300ms |

---

## Scalability

### Current Capacity
- **VPS:** 1 EA Bot, 1 API Server
- **Concurrent Users:** ~100 (Vercel free tier)
- **Database:** 500MB (Supabase free tier)

### Scale Up Options
1. **More EA Bots:** Add `account_id` to distinguish multiple bots
2. **Load Balancer:** Add Nginx/Caddy for multiple API servers
3. **Database:** Upgrade Supabase to Pro ($25/month)
4. **CDN:** Use Vercel Edge Network (automatic)
5. **Caching:** Add Redis for frequently accessed data

---

## Monitoring

### VPS Monitoring
```bash
pm2 monit              # CPU/Memory usage
pm2 logs mt5-api       # Application logs
pm2 status             # Process status
```

### Supabase Monitoring
- Dashboard → Logs
- API requests count
- Database size
- Realtime connections

### Vercel Monitoring
- Dashboard → Analytics
- Page views
- API calls
- Error rate

---

**Tài liệu chi tiết:** Xem `VERCEL_VPS_SETUP.md` và `DEPLOY_QUICKSTART.md`
