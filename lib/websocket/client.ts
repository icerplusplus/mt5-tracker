import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Get WebSocket URL from environment variable
    // For development: ws://103.179.172.89:3001
    // For production: Same VPS server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://103.179.172.89:3001';
    
    // Detect environment
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined;
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV; // 'production', 'preview', or 'development'
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 WebSocket Client Initialization');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Environment Info:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   Is Production:', isProduction);
    console.log('   Is Vercel:', isVercel);
    console.log('   Vercel Environment:', vercelEnv || 'N/A');
    console.log('   Vercel URL:', vercelUrl || 'N/A');
    console.log('   Current Origin:', typeof window !== 'undefined' ? window.location.origin : 'SSR');
    console.log('');
    console.log('🔗 Connection Details:');
    console.log('   WebSocket URL:', wsUrl);
    console.log('   Transports: websocket, polling');
    console.log('   Reconnection: enabled (max 10 attempts)');
    console.log('   Timeout: 20000ms');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('⏳ Attempting to connect...');
    
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000
    });

    socket.on('connect', () => {
      const timestamp = new Date().toISOString();
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ WebSocket Connected Successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Connection Info:');
      console.log('   Socket ID:', socket?.id);
      console.log('   Server URL:', wsUrl);
      console.log('   Transport:', socket?.io.engine.transport.name);
      console.log('   Connected At:', timestamp);
      console.log('   Environment:', isVercel ? `Vercel (${vercelEnv})` : 'Local');
      if (typeof window !== 'undefined') {
        console.log('   Client Origin:', window.location.origin);
        console.log('   Client URL:', window.location.href);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      
      // Send test ping to verify connection
      socket?.emit('ping', { 
        timestamp, 
        origin: typeof window !== 'undefined' ? window.location.origin : 'SSR',
        env: vercelEnv || 'local'
      });
    });

    socket.on('disconnect', (reason) => {
      const timestamp = new Date().toISOString();
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ WebSocket Disconnected');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Disconnect Info:');
      console.log('   Reason:', reason);
      console.log('   Timestamp:', timestamp);
      console.log('   Environment:', isVercel ? `Vercel (${vercelEnv})` : 'Local');
      console.log('');
      console.log('💡 Common reasons:');
      console.log('   - "io server disconnect": Server closed connection');
      console.log('   - "io client disconnect": Client closed connection');
      console.log('   - "ping timeout": No response from server');
      console.log('   - "transport close": Network issue');
      console.log('   - "transport error": Connection error');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });

    socket.on('connect_error', (error: any) => {
      const timestamp = new Date().toISOString();
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ WebSocket Connection Error');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('📊 Error Details:');
      console.error('   Message:', error.message || 'Unknown error');
      console.error('   Type:', error.type || 'Unknown');
      console.error('   Description:', error.description || 'N/A');
      console.error('   Timestamp:', timestamp);
      console.error('   Target URL:', wsUrl);
      console.error('   Environment:', isVercel ? `Vercel (${vercelEnv})` : 'Local');
      if (typeof window !== 'undefined') {
        console.error('   Client Origin:', window.location.origin);
      }
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('   1. Check if WebSocket server is running on VPS');
      console.log('   2. Verify ALLOWED_ORIGINS includes your domain');
      console.log('   3. Check firewall allows port 3001');
      console.log('   4. Test health check: curl http://103.179.172.89:3001/health');
      if (isVercel) {
        console.log('   5. Verify NEXT_PUBLIC_WS_URL is set in Vercel environment variables');
        console.log('   6. Check Vercel logs for network issues');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });

    socket.on('reconnect', (attemptNumber) => {
      const timestamp = new Date().toISOString();
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔄 WebSocket Reconnected');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Reconnection Info:');
      console.log('   Attempts:', attemptNumber);
      console.log('   Socket ID:', socket?.id);
      console.log('   Timestamp:', timestamp);
      console.log('   Environment:', isVercel ? `Vercel (${vercelEnv})` : 'Local');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnecting... attempt ${attemptNumber}/10`);
    });

    socket.on('reconnect_error', (error: any) => {
      console.error('❌ Reconnection error:', error.message || 'Unknown error');
    });

    socket.on('reconnect_failed', () => {
      console.error('');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ WebSocket Reconnection Failed');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('   All reconnection attempts exhausted (10/10)');
      console.error('   Server URL:', wsUrl);
      console.error('   Environment:', isVercel ? `Vercel (${vercelEnv})` : 'Local');
      console.error('');
      console.error('   Please check:');
      console.error('   - WebSocket server is running');
      console.error('   - Network connectivity');
      console.error('   - Firewall settings');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('');
    });

    // Log when receiving data (for debugging)
    socket.onAny((eventName, ...args) => {
      if (!['ping', 'pong'].includes(eventName)) {
        console.log(`📡 [${eventName}] Received data from server`);
      }
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
