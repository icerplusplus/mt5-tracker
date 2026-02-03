# 🔗 Integration Guide - Connect API Routes to WebSocket Server

## 🎯 Overview

Your Next.js API routes need to broadcast data to the WebSocket server running on VPS.

## 📊 Architecture

```
EA Bot → Next.js API (Vercel) → WebSocket Server (VPS) → Clients
```

## 🔧 Integration Options

### Option 1: HTTP Webhook (Recommended)

API routes send HTTP POST to WebSocket server to trigger broadcasts.

### Option 2: Direct Socket.IO Client

API routes connect as Socket.IO client to broadcast.

### Option 3: Message Queue (Advanced)

Use Redis/RabbitMQ for reliable message delivery.

---

## ✅ Option 1: HTTP Webhook (Recommended)

### Step 1: Add Webhook Endpoint to WebSocket Server

Update `websocket-server/server.js`:

```javascript
// Add after httpServer creation, before Socket.IO setup

// Webhook endpoint for API routes to trigger broadcasts
httpServer.on('request', (req, res) => {
  // Health check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'MT5 WebSocket Server',
      uptime: process.uptime(),
      connections: io ? io.engine.clientsCount : 0,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Webhook endpoints
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Verify API key
        const apiKey = req.headers['x-api-key'];
        if (apiKey !== process.env.MT5_API_KEY) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }
        
        // Route to appropriate broadcast function
        if (req.url === '/webhook/positions') {
          broadcastPositions(data.positions || []);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
        else if (req.url === '/webhook/account') {
          broadcastAccountInfo(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
        else if (req.url === '/webhook/tick') {
          broadcastTickData(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
        else if (req.url === '/webhook/chart') {
          broadcastChartData(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
        else if (req.url === '/webhook/bot-status') {
          broadcastBotStatus(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
        else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});
```

### Step 2: Create Webhook Helper in Next.js

Create `lib/websocket/webhook.ts`:

```typescript
const WS_SERVER_URL = process.env.WS_SERVER_URL || 'http://103.179.172.89:3001';
const MT5_API_KEY = process.env.MT5_API_KEY;

export async function broadcastToWebSocket(endpoint: string, data: any) {
  try {
    const response = await fetch(`${WS_SERVER_URL}/webhook/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': MT5_API_KEY || ''
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error(`WebSocket broadcast failed: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('WebSocket broadcast error:', error);
    return false;
  }
}
```

### Step 3: Update API Routes

**Example: `app/api/mt5/positions/route.ts`**

```typescript
import { broadcastToWebSocket } from '@/lib/websocket/webhook';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { positions } = body;
    
    // Save to database...
    const { data, error } = await supabase
      .from('open_positions')
      .upsert(positions);
    
    // Broadcast to WebSocket server
    await broadcastToWebSocket('positions', { positions: data || [] });
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 4: Add Environment Variable

**In Next.js `.env.local`:**
```env
WS_SERVER_URL=http://103.179.172.89:3001
```

**In Vercel:**
Add environment variable:
- Key: `WS_SERVER_URL`
- Value: `http://103.179.172.89:3001`

---

## 🧪 Testing

### 1. Test Webhook Endpoint

```bash
curl -X POST http://103.179.172.89:3001/webhook/positions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{"positions": [{"ticket": 123, "symbol": "EURUSD"}]}'
```

Expected response:
```json
{"success": true}
```

### 2. Test from Next.js API

```bash
# Call your Next.js API
curl -X POST http://localhost:3000/api/mt5/positions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{"positions": [...]}'
```

### 3. Check WebSocket Server Logs

```bash
pm2 logs mt5-websocket
```

Should see:
```
📡 Broadcasted 1 positions to 2 clients
```

---

## 📝 Update All API Routes

Update these files to use webhook:

1. ✅ `app/api/mt5/positions/route.ts`
2. ✅ `app/api/mt5/account-info/route.ts`
3. ✅ `app/api/mt5/tick-data/route.ts`
4. ✅ `app/api/mt5/chart-data/route.ts`
5. ✅ `app/api/mt5/bot-status/route.ts`

---

## 🔒 Security

### API Key Authentication

WebSocket server verifies `X-API-Key` header:
```javascript
const apiKey = req.headers['x-api-key'];
if (apiKey !== process.env.MT5_API_KEY) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Firewall Rules

Only allow webhook calls from:
- Vercel IPs
- Your development machine

---

## 🎉 Done!

Your Next.js API routes now broadcast to WebSocket server on VPS!

**Flow:**
```
EA Bot → Next.js API (Vercel) → HTTP Webhook → WebSocket Server (VPS) → Clients
```

**Benefits:**
- ✅ Works with Vercel (serverless)
- ✅ Reliable HTTP communication
- ✅ Simple to implement
- ✅ Easy to debug
