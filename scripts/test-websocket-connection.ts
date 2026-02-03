/**
 * Test WebSocket connection to VPS server
 * Run: npx tsx scripts/test-websocket-connection.ts
 */

import { io } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://103.179.172.89:3001';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 WebSocket Connection Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📍 Target:', WS_URL);
console.log('⏳ Connecting...');
console.log('');

const socket = io(WS_URL, {
  transports: ['websocket', 'polling'],
  reconnection: false,
  timeout: 10000
});

let connected = false;

socket.on('connect', () => {
  connected = true;
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CONNECTION SUCCESSFUL!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Connection Info:');
  console.log('   Socket ID:', socket.id);
  console.log('   Transport:', socket.io.engine.transport.name);
  console.log('   Connected:', new Date().toISOString());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✨ WebSocket server is working correctly!');
  console.log('');
  
  // Disconnect after success
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

socket.on('connect_error', (error) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ CONNECTION FAILED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📊 Error Details:');
  console.error('   Message:', error.message);
  console.error('   Type:', error.type || 'Unknown');
  console.error('   Target:', WS_URL);
  console.log('');
  console.log('🔍 Troubleshooting:');
  console.log('   1. Check if WebSocket server is running on VPS');
  console.log('      → Run: node server.js');
  console.log('');
  console.log('   2. Test health check:');
  console.log('      → curl http://103.179.172.89:3001/health');
  console.log('');
  console.log('   3. Check firewall allows port 3001:');
  console.log('      → New-NetFirewallRule -DisplayName "WebSocket Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow');
  console.log('');
  console.log('   4. Verify ALLOWED_ORIGINS in .env includes your domain');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  if (connected) {
    console.log('👋 Disconnected:', reason);
  }
});

// Timeout after 15 seconds
setTimeout(() => {
  if (!connected) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ CONNECTION TIMEOUT!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('   No response from server after 15 seconds');
    console.error('   Target:', WS_URL);
    console.log('');
    console.log('🔍 Please check:');
    console.log('   - WebSocket server is running');
    console.log('   - VPS is online and accessible');
    console.log('   - Network connectivity');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    socket.disconnect();
    process.exit(1);
  }
}, 15000);
