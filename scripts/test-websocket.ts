#!/usr/bin/env tsx

import { io } from 'socket.io-client';

console.log('🧪 Testing WebSocket Connection...\n');

const socket = io('http://localhost:3000', {
  path: '/api/socket',
  addTrailingSlash: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 3
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected!');
  console.log('   Socket ID:', socket.id);
  console.log('   Connected:', socket.connected);
  console.log('');
  
  // Listen for positions updates
  socket.on('positions:update', (data: any[]) => {
    console.log('📊 Received positions update:', data.length, 'positions');
    if (data.length > 0) {
      console.log('   First position:', {
        ticket: data[0].ticket,
        symbol: data[0].symbol,
        type: data[0].type,
        profit: data[0].profit
      });
    }
  });

  // Listen for account updates
  socket.on('account:update', (data: any) => {
    console.log('💰 Received account update:', {
      balance: data.balance,
      equity: data.equity,
      profit: data.profit
    });
  });

  // Listen for bot status
  socket.on('bot:status', (data: any) => {
    console.log('🤖 Received bot status:', data.status);
  });

  console.log('👂 Listening for events...');
  console.log('   - positions:update');
  console.log('   - account:update');
  console.log('   - bot:status');
  console.log('');
  console.log('💡 Open web app and make changes to see realtime updates');
  console.log('   Press Ctrl+C to exit\n');
});

socket.on('disconnect', () => {
  console.log('❌ WebSocket disconnected');
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.log('');
  console.log('💡 Make sure server is running:');
  console.log('   pnpm dev');
  process.exit(1);
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n👋 Closing connection...');
  socket.disconnect();
  process.exit(0);
});
