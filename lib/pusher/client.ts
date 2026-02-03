"use client";

import Pusher from 'pusher-js';

let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (!pusherClient) {
    const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1';
    
    // Detect environment
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined;
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔌 Pusher Client Initialization');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Environment Info:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   Is Production:', isProduction);
    console.log('   Is Vercel:', isVercel);
    console.log('   Vercel Environment:', vercelEnv || 'N/A');
    console.log('   Current Origin:', typeof window !== 'undefined' ? window.location.origin : 'SSR');
    console.log('');
    console.log('🔗 Pusher Config:');
    console.log('   App Key:', appKey ? `${appKey.substring(0, 10)}...` : 'NOT SET');
    console.log('   Cluster:', cluster);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    pusherClient = new Pusher(appKey, {
      cluster: cluster,
      forceTLS: true,
    });

    // Connection state logging
    pusherClient.connection.bind('connected', () => {
      const timestamp = new Date().toISOString();
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Pusher Connected Successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Connection Info:');
      console.log('   Socket ID:', pusherClient?.connection.socket_id);
      console.log('   State:', pusherClient?.connection.state);
      console.log('   Connected At:', timestamp);
      console.log('   Environment:', isVercel ? `Vercel (${vercelEnv})` : 'Local');
      if (typeof window !== 'undefined') {
        console.log('   Client Origin:', window.location.origin);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });

    pusherClient.connection.bind('disconnected', () => {
      const timestamp = new Date().toISOString();
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ Pusher Disconnected');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('   Timestamp:', timestamp);
      console.log('   State:', pusherClient?.connection.state);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });

    pusherClient.connection.bind('error', (error: any) => {
      const timestamp = new Date().toISOString();
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ Pusher Connection Error');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('📊 Error Details:');
      console.error('   Message:', error.error?.message || error.message || 'Unknown error');
      console.error('   Type:', error.type || 'Unknown');
      console.error('   Timestamp:', timestamp);
      console.error('   Environment:', isVercel ? `Vercel (${vercelEnv})` : 'Local');
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('   1. Check NEXT_PUBLIC_PUSHER_APP_KEY is set');
      console.log('   2. Verify Pusher app is active');
      console.log('   3. Check Pusher dashboard for errors');
      if (isVercel) {
        console.log('   4. Verify environment variables in Vercel');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });

    pusherClient.connection.bind('state_change', (states: any) => {
      console.log(`🔄 Pusher state: ${states.previous} → ${states.current}`);
    });
  }

  return pusherClient;
}

export function disconnectPusher() {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}
