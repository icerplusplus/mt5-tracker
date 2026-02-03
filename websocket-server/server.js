require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');

// Configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

console.log('🚀 Starting MT5 WebSocket Server...');
console.log('📍 Port:', PORT);
console.log('📍 Host:', HOST);
console.log('🌐 Allowed Origins:', ALLOWED_ORIGINS);

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Health check endpoint
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

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store connected clients
const clients = new Map();

// Socket.IO event handlers
io.on('connection', (socket) => {
  const clientId = socket.id;
  const clientIp = socket.handshake.address;
  const userAgent = socket.handshake.headers['user-agent'] || 'Unknown';
  const origin = socket.handshake.headers.origin || 'Unknown';
  const connectedAt = new Date();
  
  console.log('\n' + '='.repeat(80));
  console.log(`✅ NEW CONNECTION`);
  console.log(`   Client ID: ${clientId}`);
  console.log(`   IP Address: ${clientIp}`);
  console.log(`   Origin: ${origin}`);
  console.log(`   User Agent: ${userAgent}`);
  console.log(`   Time: ${connectedAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
  console.log(`   Total Active Connections: ${io.engine.clientsCount}`);
  console.log('='.repeat(80) + '\n');
  
  // Store client info
  clients.set(clientId, {
    id: clientId,
    ip: clientIp,
    origin: origin,
    userAgent: userAgent,
    connectedAt: connectedAt,
    subscriptions: [],
    lastActivity: connectedAt
  });

  // Handle client subscriptions
  socket.on('subscribe', (channel) => {
    const client = clients.get(clientId);
    if (client && !client.subscriptions.includes(channel)) {
      client.subscriptions.push(channel);
      client.lastActivity = new Date();
      console.log(`📡 [${clientId.substring(0, 8)}...] subscribed to: ${channel}`);
    }
  });

  socket.on('unsubscribe', (channel) => {
    const client = clients.get(clientId);
    if (client) {
      client.subscriptions = client.subscriptions.filter(c => c !== channel);
      client.lastActivity = new Date();
      console.log(`📡 [${clientId.substring(0, 8)}...] unsubscribed from: ${channel}`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    const client = clients.get(clientId);
    const duration = client ? Math.round((Date.now() - client.connectedAt.getTime()) / 1000) : 0;
    
    console.log('\n' + '-'.repeat(80));
    console.log(`❌ CLIENT DISCONNECTED`);
    console.log(`   Client ID: ${clientId}`);
    console.log(`   IP Address: ${clientIp}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Duration: ${duration}s (${Math.floor(duration / 60)}m ${duration % 60}s)`);
    console.log(`   Remaining Connections: ${io.engine.clientsCount - 1}`);
    console.log('-'.repeat(80) + '\n');
    
    clients.delete(clientId);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`⚠️ Socket error for [${clientId.substring(0, 8)}...]:`, error.message);
  });
});

// Broadcast functions (called by API routes)
let lastBroadcastLog = {
  positions: 0,
  account: 0,
  bot: 0,
  trade: 0,
  chart: 0,
  tick: 0
};

function broadcastPositions(positions) {
  io.emit('positions:update', positions);
  const now = Date.now();
  // Log every 5 seconds to avoid spam
  if (now - lastBroadcastLog.positions > 5000) {
    console.log(`📡 [POSITIONS] Broadcasted ${positions.length} positions to ${io.engine.clientsCount} clients`);
    lastBroadcastLog.positions = now;
  }
}

function broadcastAccountInfo(accountInfo) {
  io.emit('account:update', accountInfo);
  const now = Date.now();
  // Log every 5 seconds to avoid spam
  if (now - lastBroadcastLog.account > 5000) {
    console.log(`📡 [ACCOUNT] Broadcasted account info to ${io.engine.clientsCount} clients`);
    console.log(`   Balance: $${accountInfo.balance?.toFixed(2)} | Equity: $${accountInfo.equity?.toFixed(2)} | Profit: $${accountInfo.profit?.toFixed(2)}`);
    lastBroadcastLog.account = now;
  }
}

function broadcastBotStatus(status) {
  io.emit('bot:status', status);
  console.log(`📡 [BOT STATUS] ${status.is_running ? '🟢 RUNNING' : '🔴 STOPPED'} | Account: ${status.account_number || 'N/A'} | Broadcasted to ${io.engine.clientsCount} clients`);
}

function broadcastTrade(trade) {
  io.emit('trade:new', trade);
  console.log(`📡 [NEW TRADE] ${trade.type} ${trade.symbol} | Volume: ${trade.volume} | Price: ${trade.price} | Broadcasted to ${io.engine.clientsCount} clients`);
}

function broadcastChartData(bar) {
  io.emit('chart:update', bar);
  const now = Date.now();
  // Log every 10 seconds to avoid spam
  if (now - lastBroadcastLog.chart > 10000) {
    console.log(`📡 [CHART] ${bar.symbol} ${bar.timeframe} | Close: ${bar.close} | Broadcasted to ${io.engine.clientsCount} clients`);
    lastBroadcastLog.chart = now;
  }
}

function broadcastTickData(tick) {
  io.emit('tick:update', tick);
  const now = Date.now();
  // Log every 10 seconds to avoid spam
  if (now - lastBroadcastLog.tick > 10000) {
    console.log(`📡 [TICK] ${tick.symbol} @ ${tick.price} | Broadcasted to ${io.engine.clientsCount} clients`);
    lastBroadcastLog.tick = now;
  }
}

// Export broadcast functions for API routes
global.broadcastPositions = broadcastPositions;
global.broadcastAccountInfo = broadcastAccountInfo;
global.broadcastBotStatus = broadcastBotStatus;
global.broadcastTrade = broadcastTrade;
global.broadcastChartData = broadcastChartData;
global.broadcastTickData = broadcastTickData;

// Start server
httpServer.listen(PORT, HOST, () => {
  console.log('\n' + '█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + '  🚀 MT5 WebSocket Server Started Successfully!'.padEnd(78) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80));
  console.log('');
  console.log('📍 Server Information:');
  console.log(`   HTTP Endpoint: http://${HOST}:${PORT}`);
  console.log(`   WebSocket Endpoint: ws://${HOST}:${PORT}`);
  console.log(`   Health Check: http://${HOST}:${PORT}/health`);
  console.log('');
  console.log('🌐 Allowed Origins:');
  ALLOWED_ORIGINS.forEach(origin => console.log(`   - ${origin}`));
  console.log('');
  console.log('📊 Server Status:');
  console.log(`   Node Version: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   PID: ${process.pid}`);
  console.log(`   Started: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
  console.log('');
  console.log('█'.repeat(80));
  console.log('\n⏳ Waiting for connections...\n');
});

// Log active connections every 60 seconds
setInterval(() => {
  if (clients.size > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log(`📊 ACTIVE CONNECTIONS SUMMARY (${new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })})`);
    console.log(`   Total Connections: ${clients.size}`);
    console.log('─'.repeat(80));
    
    clients.forEach((client, id) => {
      const duration = Math.round((Date.now() - client.connectedAt.getTime()) / 1000);
      const lastActivity = Math.round((Date.now() - client.lastActivity.getTime()) / 1000);
      console.log(`   [${id.substring(0, 8)}...] ${client.ip}`);
      console.log(`      Origin: ${client.origin}`);
      console.log(`      Connected: ${Math.floor(duration / 60)}m ${duration % 60}s ago`);
      console.log(`      Last Activity: ${lastActivity}s ago`);
      console.log(`      Subscriptions: ${client.subscriptions.length > 0 ? client.subscriptions.join(', ') : 'None'}`);
    });
    
    console.log('─'.repeat(80) + '\n');
  }
}, 60000); // Every 60 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
