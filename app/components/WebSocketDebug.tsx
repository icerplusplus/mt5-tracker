"use client";

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/websocket/client';

interface ConnectionInfo {
  connected: boolean;
  socketId: string | null;
  transport: string | null;
  environment: string;
  vercelEnv: string | null;
  vercelUrl: string | null;
  wsUrl: string;
  lastConnected: string | null;
  lastDisconnected: string | null;
  disconnectReason: string | null;
  reconnectAttempts: number;
}

export default function WebSocketDebug() {
  const [info, setInfo] = useState<ConnectionInfo>({
    connected: false,
    socketId: null,
    transport: null,
    environment: process.env.NODE_ENV || 'unknown',
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV || null,
    vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL || null,
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://103.179.172.89:3001',
    lastConnected: null,
    lastDisconnected: null,
    disconnectReason: null,
    reconnectAttempts: 0
  });

  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setInfo(prev => ({
        ...prev,
        connected: true,
        socketId: socket.id || null,
        transport: socket.io.engine.transport.name || null,
        lastConnected: new Date().toISOString(),
        reconnectAttempts: 0
      }));
    };

    const handleDisconnect = (reason: string) => {
      setInfo(prev => ({
        ...prev,
        connected: false,
        lastDisconnected: new Date().toISOString(),
        disconnectReason: reason
      }));
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      setInfo(prev => ({
        ...prev,
        reconnectAttempts: attemptNumber
      }));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);

    // Initial state
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, []);

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all ${
          info.connected 
            ? 'bg-green-500 hover:bg-green-600' 
            : info.reconnectAttempts > 0
            ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse'
            : 'bg-red-500 hover:bg-red-600'
        }`}
        title="WebSocket Debug Info"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {/* Debug Panel */}
      {showDebug && (
        <div className="fixed bottom-20 right-4 z-50 w-96 bg-bg-tertiary border border-border-primary rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`px-4 py-3 flex items-center justify-between ${
            info.connected ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                info.connected 
                  ? 'bg-green-500 animate-pulse' 
                  : info.reconnectAttempts > 0
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`}></div>
              <h3 className="text-sm font-semibold text-text-primary">
                WebSocket Debug
              </h3>
            </div>
            <button
              onClick={() => setShowDebug(false)}
              className="text-text-tertiary hover:text-text-primary"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto text-xs">
            {/* Connection Status */}
            <div>
              <div className="text-text-tertiary mb-1">Status</div>
              <div className={`font-semibold ${
                info.connected ? 'text-green-400' : 'text-red-400'
              }`}>
                {info.connected ? '✅ Connected' : '❌ Disconnected'}
              </div>
            </div>

            {/* Socket ID */}
            {info.socketId && (
              <div>
                <div className="text-text-tertiary mb-1">Socket ID</div>
                <div className="text-text-primary font-mono text-[10px] break-all">
                  {info.socketId}
                </div>
              </div>
            )}

            {/* Transport */}
            {info.transport && (
              <div>
                <div className="text-text-tertiary mb-1">Transport</div>
                <div className="text-text-primary font-semibold">
                  {info.transport}
                </div>
              </div>
            )}

            {/* WebSocket URL */}
            <div>
              <div className="text-text-tertiary mb-1">WebSocket URL</div>
              <div className="text-text-primary font-mono text-[10px] break-all">
                {info.wsUrl}
              </div>
            </div>

            {/* Environment */}
            <div>
              <div className="text-text-tertiary mb-1">Environment</div>
              <div className="text-text-primary">
                {info.environment}
                {info.vercelEnv && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px]">
                    Vercel: {info.vercelEnv}
                  </span>
                )}
              </div>
            </div>

            {/* Vercel URL */}
            {info.vercelUrl && (
              <div>
                <div className="text-text-tertiary mb-1">Vercel URL</div>
                <div className="text-text-primary font-mono text-[10px] break-all">
                  {info.vercelUrl}
                </div>
              </div>
            )}

            {/* Client Origin */}
            {typeof window !== 'undefined' && (
              <div>
                <div className="text-text-tertiary mb-1">Client Origin</div>
                <div className="text-text-primary font-mono text-[10px] break-all">
                  {window.location.origin}
                </div>
              </div>
            )}

            {/* Last Connected */}
            {info.lastConnected && (
              <div>
                <div className="text-text-tertiary mb-1">Last Connected</div>
                <div className="text-text-primary text-[10px]">
                  {new Date(info.lastConnected).toLocaleString()}
                </div>
              </div>
            )}

            {/* Last Disconnected */}
            {info.lastDisconnected && (
              <div>
                <div className="text-text-tertiary mb-1">Last Disconnected</div>
                <div className="text-text-primary text-[10px]">
                  {new Date(info.lastDisconnected).toLocaleString()}
                </div>
              </div>
            )}

            {/* Disconnect Reason */}
            {info.disconnectReason && (
              <div>
                <div className="text-text-tertiary mb-1">Disconnect Reason</div>
                <div className="text-red-400 text-[10px]">
                  {info.disconnectReason}
                </div>
              </div>
            )}

            {/* Reconnect Attempts */}
            {info.reconnectAttempts > 0 && (
              <div>
                <div className="text-text-tertiary mb-1">Reconnect Attempts</div>
                <div className="text-yellow-400 font-semibold">
                  {info.reconnectAttempts} / 10
                </div>
              </div>
            )}

            {/* Troubleshooting */}
            {!info.connected && (
              <div className="pt-3 border-t border-border-primary">
                <div className="text-text-tertiary mb-2">🔍 Troubleshooting</div>
                <ul className="text-text-secondary text-[10px] space-y-1">
                  <li>• Check VPS server is running</li>
                  <li>• Verify ALLOWED_ORIGINS</li>
                  <li>• Check firewall port 3001</li>
                  <li>• Test: curl http://103.179.172.89:3001/health</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-bg-hover border-t border-border-primary text-[10px] text-text-tertiary">
            Press F12 to see detailed console logs
          </div>
        </div>
      )}
    </>
  );
}
