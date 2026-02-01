# 🏗️ System Architecture

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Next.js 15 Dashboard)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Account  │  │   Bot    │  │  Trades  │  │Statistics│      │
│  │   Info   │  │  Status  │  │ History  │  │  Charts  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │  Open    │  │  Order   │  │   Bot    │                    │
│  │Positions │  │   Form   │  │ Controls │                    │
│  └──────────┘  └──────────┘  └──────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                    Real-time Subscriptions
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tables: trades, open_positions, account_history,       │  │
│  │          bot_status, commands, statistics, chart_data   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Real-time: Postgres Changes → WebSocket → Frontend     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                    HTTP POST/GET (API Key Auth)
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/mt5/*        - Receive data from EA Bot           │  │
│  │  /api/commands/*   - Send commands to EA Bot            │  │
│  │  /api/statistics   - Calculate trading statistics       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                    HTTP POST/GET (Polling every 5s)
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    EA BOT (MetaTrader 5)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Send account info, positions, trades, bot status     │  │
│  │  • Poll for pending commands                            │  │
│  │  • Execute commands (place/close orders, pause/resume)  │  │
│  │  • Report execution results                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. EA Bot → Dashboard (Real-time Updates)

```
┌──────────────┐
│   EA Bot     │
│  (MT5/MQL5)  │
└──────┬───────┘
       │ Every 5 seconds
       │ HTTP POST + API Key
       ↓
┌──────────────────────────────────┐
│  API Routes                      │
│  • /api/mt5/account-info         │
│  • /api/mt5/positions            │
│  • /api/mt5/trades               │
│  • /api/mt5/bot-status           │
└──────┬───────────────────────────┘
       │ Validate API Key
       │ Insert/Update Data
       ↓
┌──────────────────────────────────┐
│  Supabase Database               │
│  • trades                        │
│  • open_positions                │
│  • account_history               │
│  • bot_status                    │
└──────┬───────────────────────────┘
       │ Postgres Changes Event
       │ Real-time Subscription
       ↓
┌──────────────────────────────────┐
│  Frontend Components             │
│  • useTradingStore (Zustand)     │
│  • Auto-update UI                │
└──────────────────────────────────┘
```

### 2. Dashboard → EA Bot (Commands)

```
┌──────────────┐
│    User      │
│  Dashboard   │
└──────┬───────┘
       │ Click: Place Order / Close / Pause
       │ HTTP POST
       ↓
┌──────────────────────────────────┐
│  API Routes                      │
│  • /api/commands/place-order     │
│  • /api/commands/close-order     │
│  • /api/commands/bot-control     │
└──────┬───────────────────────────┘
       │ Create Command
       │ Status: PENDING
       ↓
┌──────────────────────────────────┐
│  Supabase Database               │
│  • commands table                │
│    (id, type, params, status)    │
└──────┬───────────────────────────┘
       │ EA Bot Polling (every 5s)
       │ HTTP GET /api/mt5/commands
       ↓
┌──────────────────────────────────┐
│  EA Bot                          │
│  • Fetch PENDING commands        │
│  • Execute (place/close order)   │
│  • POST result back              │
└──────┬───────────────────────────┘
       │ HTTP POST /api/mt5/commands
       │ Update Status: EXECUTED/FAILED
       ↓
┌──────────────────────────────────┐
│  Supabase Database               │
│  • commands.status = EXECUTED    │
│  • commands.result = {...}       │
└──────────────────────────────────┘
```

---

## 🗂️ Component Architecture

### Frontend (Next.js App Router)

```
app/
├── layout.tsx                 # Root layout with fonts
├── page.tsx                   # Main dashboard (orchestrator)
├── globals.css                # Global styles + animations
│
├── components/
│   ├── AccountInfo.tsx        # Display balance, equity, margin
│   ├── BotStatus.tsx          # Bot status with heartbeat
│   ├── BotControls.tsx        # Pause/Resume buttons
│   ├── OpenPositions.tsx      # List open positions + close
│   ├── OrderForm.tsx          # Place new order form
│   ├── TradeHistory.tsx       # Closed trades table
│   └── Statistics.tsx         # Stats with charts
│
└── api/
    ├── mt5/
    │   ├── account-info/      # Receive account data
    │   ├── positions/         # Receive positions
    │   ├── trades/            # Receive trade history
    │   ├── bot-status/        # Receive bot status
    │   └── commands/          # EA Bot polling + results
    │
    ├── commands/
    │   ├── place-order/       # Create place order command
    │   ├── close-order/       # Create close order command
    │   └── bot-control/       # Create pause/resume command
    │
    └── statistics/            # Calculate statistics
```

### State Management (Zustand)

```typescript
lib/store/trading-store.ts

State:
  - positions: OpenPosition[]
  - accountInfo: AccountInfo | null
  - botStatus: BotStatusData | null
  - recentTrades: Trade[]

Actions:
  - setPositions()
  - setAccountInfo()
  - setBotStatus()
  - setRecentTrades()
  - addTrade()
  - updatePosition()
  - removePosition()
```

### Database Schema (Supabase)

```sql
trades
  ├── id (uuid, PK)
  ├── ticket (bigint, unique)
  ├── symbol, type, volume
  ├── open_price, close_price
  ├── open_time, close_time
  ├── profit, commission, swap
  └── timestamps

open_positions
  ├── id (uuid, PK)
  ├── ticket (bigint, unique)
  ├── symbol, type, volume
  ├── open_price, current_price
  ├── profit, sl, tp
  └── timestamps

account_history
  ├── id (uuid, PK)
  ├── timestamp
  ├── balance, equity
  ├── margin, free_margin
  └── margin_level, profit

bot_status
  ├── id (uuid, PK)
  ├── status (RUNNING/PAUSED/STOPPED)
  ├── last_heartbeat
  ├── version, account_number
  └── broker, timestamps

commands
  ├── id (uuid, PK)
  ├── command_type
  ├── parameters (jsonb)
  ├── status (PENDING/EXECUTED/FAILED)
  ├── result (jsonb)
  └── timestamps

statistics
  ├── id (uuid, PK)
  ├── period (DAILY/WEEKLY/MONTHLY/YEARLY)
  ├── period_start, period_end
  ├── total_trades, winning_trades, losing_trades
  ├── win_rate, profit_factor
  ├── total_profit, total_loss, net_profit
  └── max_drawdown, average_profit
```

---

## 🔐 Security Architecture

### Authentication Flow

```
EA Bot Request
    ↓
Check X-API-Key Header
    ↓
Compare with process.env.MT5_API_KEY
    ↓
✅ Match → Process Request
❌ No Match → 401 Unauthorized
```

### Security Layers

1. **API Key Authentication**
   - EA Bot must send `X-API-Key` header
   - Validated on every request
   - Stored in environment variables

2. **Supabase RLS (Row Level Security)**
   - Policies on all tables
   - Currently: Allow all (customize for production)
   - Can add user-based policies

3. **Environment Variables**
   - Sensitive data in `.env.local`
   - Never committed to git
   - Different keys for dev/prod

4. **HTTPS (Production)**
   - All communication encrypted
   - SSL/TLS certificates
   - Secure WebSocket connections

---

## ⚡ Performance Optimizations

### Frontend

1. **Real-time Subscriptions**
   - No polling from frontend
   - Instant updates via WebSocket
   - Efficient bandwidth usage

2. **Component Optimization**
   - React 19 automatic optimizations
   - Zustand for efficient state updates
   - Minimal re-renders

3. **Database Queries**
   - Indexed columns (ticket, timestamp, symbol)
   - Limited result sets (LIMIT clauses)
   - Efficient ORDER BY with indexes

### Backend

1. **API Routes**
   - Lightweight Next.js API routes
   - Fast JSON parsing
   - Minimal processing

2. **Database**
   - PostgreSQL with indexes
   - Efficient upsert operations
   - Real-time subscriptions

### EA Bot

1. **Polling Interval**
   - Configurable (default 5s)
   - Balance between real-time and load
   - Can reduce to 1s for faster updates

2. **Batch Operations**
   - Send multiple positions at once
   - Efficient JSON serialization
   - Minimal HTTP overhead

---

## 📊 Scalability Considerations

### Current Capacity

- **Users**: Single user (can extend to multi-user)
- **EA Bots**: Single bot (can extend to multiple)
- **Requests**: ~12 requests/minute (5s interval)
- **Database**: Supabase free tier (500MB, 2GB bandwidth)

### Scaling Strategies

1. **Horizontal Scaling**
   - Deploy multiple Next.js instances
   - Load balancer (Vercel handles this)
   - Supabase auto-scales

2. **Database Optimization**
   - Archive old trades (> 1 year)
   - Partition large tables
   - Upgrade Supabase plan

3. **Caching**
   - Redis for frequently accessed data
   - CDN for static assets
   - Browser caching

4. **Multi-User Support**
   - Add user authentication (NextAuth.js)
   - User-specific RLS policies
   - Separate data per user

---

## 🔄 Real-time Architecture

### Supabase Real-time

```typescript
// Subscribe to table changes
const channel = supabase
  .channel('table_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'open_positions' },
    (payload) => {
      // Handle change
      updateUI(payload.new);
    }
  )
  .subscribe();
```

### Benefits

- **Low Latency**: < 500ms from DB change to UI update
- **Efficient**: No polling from frontend
- **Scalable**: WebSocket connections managed by Supabase
- **Reliable**: Automatic reconnection

---

## 🧪 Testing Strategy

### Unit Tests (Future)

```typescript
// Component tests
- AccountInfo.test.tsx
- BotStatus.test.tsx
- OrderForm.test.tsx

// API tests
- /api/mt5/positions.test.ts
- /api/commands/place-order.test.ts

// Store tests
- trading-store.test.ts
```

### Integration Tests (Future)

```typescript
// End-to-end flows
- Place order → EA Bot executes → UI updates
- Close order → EA Bot closes → UI updates
- Bot pause → Status changes → UI reflects
```

### Manual Testing Checklist

- ✅ EA Bot connects and sends data
- ✅ Dashboard displays real-time updates
- ✅ Place order from web → appears in MT5
- ✅ Close order from web → closes in MT5
- ✅ Pause bot → bot stops trading
- ✅ Resume bot → bot continues
- ✅ Statistics calculate correctly
- ✅ Charts display properly
- ✅ Responsive on mobile

---

## 📈 Monitoring & Logging

### Application Logs

```typescript
// API Routes
console.log('Received data from EA Bot:', data);
console.error('Error processing request:', error);

// EA Bot (MQL5)
Print("MT5 WebApp Connector initialized");
Print("WebRequest error: ", GetLastError());
```

### Monitoring Points

1. **EA Bot Health**
   - Last heartbeat timestamp
   - Connection status
   - Error logs in MT5 Experts tab

2. **API Performance**
   - Response times
   - Error rates
   - Request volume

3. **Database**
   - Query performance
   - Connection pool usage
   - Storage usage

4. **Real-time**
   - WebSocket connections
   - Subscription status
   - Message latency

---

## 🚀 Deployment Architecture

### Development

```
Local Machine
  ├── Next.js Dev Server (localhost:3000)
  ├── Supabase Cloud (remote)
  └── MT5 EA Bot (local MT5 instance)
```

### Production

```
Vercel (or similar)
  ├── Next.js Production Build
  ├── Edge Functions
  └── CDN for static assets
      ↓
Supabase Cloud
  ├── PostgreSQL Database
  ├── Real-time Server
  └── Storage (if needed)
      ↓
VPS/Cloud Server (optional)
  └── MT5 EA Bot (if running 24/7)
```

---

## 🔧 Technology Stack Details

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 | React framework with App Router |
| | React 19 | UI library |
| | TypeScript | Type safety |
| | Tailwind CSS | Styling |
| | Zustand | State management |
| | Recharts | Charts |
| | Lucide React | Icons |
| **Backend** | Next.js API Routes | Serverless API |
| | Supabase Client | Database client |
| **Database** | Supabase (PostgreSQL) | Data storage |
| | Real-time Subscriptions | Live updates |
| **EA Bot** | MQL5 | MetaTrader 5 language |
| | WebRequest() | HTTP client |
| **DevOps** | pnpm | Package manager |
| | Vercel | Hosting (optional) |
| | Git | Version control |

---

## 📝 API Specification

### EA Bot → API

```typescript
POST /api/mt5/account-info
Headers: X-API-Key: <key>
Body: {
  balance: number,
  equity: number,
  margin: number,
  free_margin: number,
  margin_level: number,
  profit: number
}

POST /api/mt5/positions
Headers: X-API-Key: <key>
Body: {
  positions: [{
    ticket: number,
    symbol: string,
    type: 'BUY' | 'SELL',
    volume: number,
    open_price: number,
    current_price: number,
    profit: number,
    sl?: number,
    tp?: number,
    comment?: string,
    magic_number?: number,
    open_time: string
  }]
}

GET /api/mt5/commands
Headers: X-API-Key: <key>
Response: {
  success: true,
  data: [{
    id: string,
    command_type: string,
    parameters: object,
    status: string
  }]
}
```

### Dashboard → API

```typescript
POST /api/commands/place-order
Body: {
  symbol: string,
  type: 'BUY' | 'SELL',
  volume: number,
  sl?: number,
  tp?: number,
  comment?: string
}

POST /api/commands/close-order
Body: {
  ticket: number
}

POST /api/commands/bot-control
Body: {
  action: 'PAUSE' | 'RESUME'
}

GET /api/statistics?period=DAILY|WEEKLY|MONTHLY|YEARLY
Response: {
  success: true,
  data: {
    period: string,
    total_trades: number,
    win_rate: number,
    net_profit: number,
    // ... more stats
  }
}
```

---

**Last Updated**: 2026-02-01
**Version**: 1.0.0
