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
  
  console.log(`✅ Client connected: ${clientId} from ${clientIp}`);
  console.log(`📊 Total connections: ${io.engine.clientsCount}`);
  
  // Store client info
  clients.set(clientId, {
    id: clientId,
    ip: clientIp,
    connectedAt: new Date(),
    subscriptions: []
  });

  // Handle client subscriptions
  socket.on('subscribe', (channel) => {
    const client = clients.get(clientId);
    if (client && !client.subscriptions.includes(channel)) {
      client.subscriptions.push(channel);
      console.log(`📡 Client ${clientId} subscribed to: ${channel}`);
    }
  });

  socket.on('unsubscribe', (channel) => {
    const client = clients.get(clientId);
    if (client) {
      client.subscriptions = client.subscriptions.filter(c => c !== channel);
      console.log(`📡 Client ${clientId} unsubscribed from: ${channel}`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${clientId} (${reason})`);
    console.log(`📊 Total connections: ${io.engine.clientsCount}`);
    clients.delete(clientId);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`⚠️ Socket error for ${clientId}:`, error);
  });
});

// Broadcast functions (called by API routes)
function broadcastPositions(positions) {
  io.emit('positions:update', positions);
  console.log(`📡 Broadcasted ${positions.length} positions to ${io.engine.clientsCount} clients`);
}

function broadcastAccountInfo(accountInfo) {
  io.emit('account:update', accountInfo);
  console.log(`📡 Broadcasted account info to ${io.engine.clientsCount} clients`);
}

function broadcastBotStatus(status) {
  io.emit('bot:status', status);
  console.log(`📡 Broadcasted bot status to ${io.engine.clientsCount} clients`);
}

function broadcastTrade(trade) {
  io.emit('trade:new', trade);
  console.log(`📡 Broadcasted new trade to ${io.engine.clientsCount} clients`);
}

function broadcastChartData(bar) {
  io.emit('chart:update', bar);
  // Don't log every bar to avoid spam
}

function broadcastTickData(tick) {
  io.emit('tick:update', tick);
  // Don't log every tick to avoid spam
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
  console.log('');
  console.log('✅ MT5 WebSocket Server is running!');
  console.log(`📍 HTTP: http://${HOST}:${PORT}`);
  console.log(`📍 WebSocket: ws://${HOST}:${PORT}`);
  console.log('');
  console.log('💡 Health check: http://${HOST}:${PORT}/health');
  console.log('');
});

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
