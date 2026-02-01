import { Server as SocketIOServer } from 'socket.io';

declare global {
  var io: SocketIOServer | undefined;
}

export function getIO(): SocketIOServer | undefined {
  return global.io;
}

export function broadcastPositions(positions: any[]) {
  const io = getIO();
  if (io) {
    io.emit('positions:update', positions);
    console.log('📡 Broadcasted', positions.length, 'positions to', io.engine.clientsCount, 'clients');
  }
}

export function broadcastAccountInfo(accountInfo: any) {
  const io = getIO();
  if (io) {
    io.emit('account:update', accountInfo);
    console.log('📡 Broadcasted account info');
  }
}

export function broadcastBotStatus(status: any) {
  const io = getIO();
  if (io) {
    io.emit('bot:status', status);
    console.log('📡 Broadcasted bot status');
  }
}

export function broadcastTrade(trade: any) {
  const io = getIO();
  if (io) {
    io.emit('trade:new', trade);
    console.log('📡 Broadcasted new trade');
  }
}

export function broadcastChartData(bar: any) {
  const io = getIO();
  if (io) {
    io.emit('chart:update', bar);
    // Don't log every bar to avoid spam
  }
}

export function broadcastTickData(tick: any) {
  const io = getIO();
  if (io) {
    io.emit('tick:update', tick);
    // Don't log every tick to avoid spam
  }
}
