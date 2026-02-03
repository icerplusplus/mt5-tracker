import Pusher from 'pusher';

let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
      useTLS: true,
    });
  }

  return pusherServer;
}

// Broadcast functions (thay thế WebSocket broadcasts)
export async function broadcastPositions(positions: any[]) {
  try {
    const pusher = getPusherServer();
    await pusher.trigger('mt5-channel', 'positions-update', positions);
    console.log(`📡 [PUSHER] Broadcasted ${positions.length} positions`);
  } catch (error: any) {
    console.error('❌ [PUSHER] Error broadcasting positions:', error.message);
  }
}

export async function broadcastAccountInfo(accountInfo: any) {
  try {
    const pusher = getPusherServer();
    await pusher.trigger('mt5-channel', 'account-update', accountInfo);
    console.log(`📡 [PUSHER] Broadcasted account info`);
  } catch (error: any) {
    console.error('❌ [PUSHER] Error broadcasting account:', error.message);
  }
}

export async function broadcastBotStatus(status: any) {
  try {
    const pusher = getPusherServer();
    await pusher.trigger('mt5-channel', 'bot-status', status);
    console.log(`📡 [PUSHER] Broadcasted bot status: ${status.is_running ? 'RUNNING' : 'STOPPED'}`);
  } catch (error: any) {
    console.error('❌ [PUSHER] Error broadcasting bot status:', error.message);
  }
}

export async function broadcastTrade(trade: any) {
  try {
    const pusher = getPusherServer();
    await pusher.trigger('mt5-channel', 'trade-new', trade);
    console.log(`📡 [PUSHER] Broadcasted new trade: ${trade.type} ${trade.symbol}`);
  } catch (error: any) {
    console.error('❌ [PUSHER] Error broadcasting trade:', error.message);
  }
}

export async function broadcastChartData(bar: any) {
  try {
    const pusher = getPusherServer();
    await pusher.trigger('mt5-channel', 'chart-update', bar);
    // Don't log every bar to avoid spam
  } catch (error: any) {
    console.error('❌ [PUSHER] Error broadcasting chart:', error.message);
  }
}

export async function broadcastTickData(tick: any) {
  try {
    const pusher = getPusherServer();
    await pusher.trigger('mt5-channel', 'tick-update', tick);
    // Don't log every tick to avoid spam
  } catch (error: any) {
    console.error('❌ [PUSHER] Error broadcasting tick:', error.message);
  }
}
