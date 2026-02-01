"use client";

import { useTradingStore } from '@/lib/store/trading-store';
import { TrendingUp, TrendingDown, Wifi, WifiOff, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/websocket/client';

interface TradingHeaderProps {
  onOpenSymbolSearch: () => void;
}

export default function TradingHeader({ onOpenSymbolSearch }: TradingHeaderProps) {
  const { positions, accountInfo } = useTradingStore();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  // Calculate total P&L
  const totalPnL = positions.reduce((sum, pos) => sum + pos.profit, 0);
  const hasPositions = positions.length > 0;

  return (
    <>
      {/* Mobile Header - Compact */}
      <div className="flex lg:hidden items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">MT5</span>
          <button
            onClick={onOpenSymbolSearch}
            className="p-1 rounded hover:bg-bg-hover transition-colors"
          >
            <Search className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Balance - Mobile */}
          {accountInfo && (
            <div className="text-right">
              <div className="text-[10px] text-text-tertiary">Balance</div>
              <div className="text-xs font-mono font-semibold">${accountInfo.balance.toFixed(2)}</div>
            </div>
          )}

          {/* Connection Status */}
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
            connected ? 'bg-trade-profit/20 text-trade-profit' : 'bg-trade-loss/20 text-trade-loss'
          }`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>
        </div>
      </div>

      {/* Desktop Header - Full */}
      <div className="hidden lg:flex items-center justify-between w-full">
        {/* Left - Symbol & Price */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">MT5</span>
            <span className="text-xs text-text-tertiary">Trading Dashboard</span>
            <button
              onClick={onOpenSymbolSearch}
              className="ml-2 p-1.5 rounded hover:bg-bg-hover transition-colors group"
              title="Search symbols"
            >
              <Search className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
            </button>
          </div>

          {hasPositions && (
            <>
              <div className="h-6 w-px bg-border-secondary"></div>
              <div className="flex items-center gap-4">
                {positions.slice(0, 3).map(pos => (
                  <div key={pos.ticket} className="flex items-center gap-2">
                    <span className="text-sm font-medium">{pos.symbol}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      pos.type === 'BUY' ? 'bg-trade-buy/20 text-trade-buy' : 'bg-trade-sell/20 text-trade-sell'
                    }`}>
                      {pos.type}
                    </span>
                    <span className="text-sm font-mono">{pos.current_price.toFixed(5)}</span>
                  </div>
                ))}
                {positions.length > 3 && (
                  <span className="text-xs text-text-tertiary">+{positions.length - 3} more</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right - Stats & Status */}
        <div className="flex items-center gap-6">
          {/* Total P&L */}
          {hasPositions && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Total P&L</span>
              <span className={`text-lg font-bold font-mono ${
                totalPnL >= 0 ? 'text-trade-profit' : 'text-trade-loss'
              }`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
              </span>
            </div>
          )}

          {/* Balance */}
          {accountInfo && (
            <>
              <div className="h-6 w-px bg-border-secondary"></div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs text-text-secondary">Balance</div>
                  <div className="text-sm font-mono font-semibold">${accountInfo.balance.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-text-secondary">Equity</div>
                  <div className="text-sm font-mono font-semibold">${accountInfo.equity.toFixed(2)}</div>
                </div>
              </div>
            </>
          )}

          {/* Connection Status */}
          <div className="h-6 w-px bg-border-secondary"></div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
            connected ? 'bg-trade-profit/20 text-trade-profit' : 'bg-trade-loss/20 text-trade-loss'
          }`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{connected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </>
  );
}
