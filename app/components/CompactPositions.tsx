"use client";

import { useTradingStore } from '@/lib/store/trading-store';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/websocket/client';

export default function CompactPositions() {
  const { positions, setPositions } = useTradingStore();
  const [closing, setClosing] = useState<number | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.on('positions:update', (data: any[]) => {
      setPositions(data);
    });

    // Initial load
    loadPositions();

    return () => {
      socket.off('positions:update');
    };
  }, [setPositions]);

  async function loadPositions() {
    try {
      const res = await fetch('/api/mt5/positions');
      const data = await res.json();
      if (data.success) {
        setPositions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  }

  async function handleClose(ticket: number) {
    if (!confirm('Close this position?')) return;

    setClosing(ticket);
    try {
      const res = await fetch('/api/commands/close-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket })
      });

      const data = await res.json();
      if (data.success) {
        console.log('Close order sent');
      }
    } catch (error) {
      console.error('Error closing position:', error);
    } finally {
      setClosing(null);
    }
  }

  if (positions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-text-tertiary text-sm">
        No open positions
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-bg-secondary border-b border-border-primary">
          <tr>
            <th className="text-left py-2 px-3 font-medium text-text-secondary">Symbol</th>
            <th className="text-left py-2 px-3 font-medium text-text-secondary">Type</th>
            <th className="text-right py-2 px-3 font-medium text-text-secondary">Size</th>
            <th className="text-right py-2 px-3 font-medium text-text-secondary">Entry</th>
            <th className="text-right py-2 px-3 font-medium text-text-secondary">Current</th>
            <th className="text-right py-2 px-3 font-medium text-text-secondary">P&L</th>
            <th className="text-center py-2 px-3 font-medium text-text-secondary">Action</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr 
              key={pos.ticket} 
              className="border-b border-border-primary hover:bg-bg-hover transition-colors"
            >
              <td className="py-2 px-3 font-medium">{pos.symbol}</td>
              <td className="py-2 px-3">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${
                  pos.type === 'BUY' ? 'bg-trade-buy/20 text-trade-buy' : 'bg-trade-sell/20 text-trade-sell'
                }`}>
                  {pos.type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {pos.type}
                </span>
              </td>
              <td className="py-2 px-3 text-right font-mono">{pos.volume.toFixed(2)}</td>
              <td className="py-2 px-3 text-right font-mono text-text-secondary">{pos.open_price.toFixed(5)}</td>
              <td className="py-2 px-3 text-right font-mono">{pos.current_price.toFixed(5)}</td>
              <td className={`py-2 px-3 text-right font-mono font-semibold ${
                pos.profit >= 0 ? 'text-trade-profit' : 'text-trade-loss'
              }`}>
                {pos.profit >= 0 ? '+' : ''}{pos.profit.toFixed(2)}
              </td>
              <td className="py-2 px-3 text-center">
                <button
                  onClick={() => handleClose(pos.ticket)}
                  disabled={closing === pos.ticket}
                  className="p-1 hover:bg-trade-loss/20 rounded text-trade-loss hover:text-trade-loss transition-colors disabled:opacity-50"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
