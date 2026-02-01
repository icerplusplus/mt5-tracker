"use client";

import { useTradingStore } from '@/lib/store/trading-store';
import { useEffect } from 'react';
import { getSocket } from '@/lib/websocket/client';

export default function CompactAccountInfo() {
  const { accountInfo, setAccountInfo } = useTradingStore();

  useEffect(() => {
    const socket = getSocket();
    socket.on('account:update', (data: any) => {
      setAccountInfo(data);
    });

    // Initial load
    loadAccountInfo();

    return () => {
      socket.off('account:update');
    };
  }, [setAccountInfo]);

  async function loadAccountInfo() {
    try {
      const res = await fetch('/api/mt5/account-info');
      const data = await res.json();
      if (data.success && data.data) {
        setAccountInfo(data.data);
      }
    } catch (error) {
      console.error('Error loading account info:', error);
    }
  }

  if (!accountInfo) {
    return (
      <div className="p-4 text-center text-text-tertiary text-xs">
        No account data
      </div>
    );
  }

  const marginLevel = accountInfo.margin > 0 
    ? (accountInfo.equity / accountInfo.margin) * 100 
    : 0;

  return (
    <div className="p-4 space-y-3">
      {/* Balance & Equity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-text-secondary mb-0.5">Balance</div>
          <div className="text-lg font-bold font-mono">${accountInfo.balance.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-text-secondary mb-0.5">Equity</div>
          <div className="text-lg font-bold font-mono">${accountInfo.equity.toFixed(2)}</div>
        </div>
      </div>

      {/* Profit */}
      <div>
        <div className="text-xs text-text-secondary mb-0.5">Floating P&L</div>
        <div className={`text-xl font-bold font-mono ${
          accountInfo.profit >= 0 ? 'text-trade-profit' : 'text-trade-loss'
        }`}>
          {accountInfo.profit >= 0 ? '+' : ''}{accountInfo.profit.toFixed(2)}
        </div>
      </div>

      {/* Margin Info */}
      <div className="pt-3 border-t border-border-primary space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-text-secondary">Margin</span>
          <span className="font-mono">${accountInfo.margin.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-secondary">Free Margin</span>
          <span className="font-mono">${accountInfo.free_margin.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-secondary">Margin Level</span>
          <span className={`font-mono font-semibold ${
            marginLevel > 200 ? 'text-trade-profit' : 
            marginLevel > 100 ? 'text-accent' : 
            'text-trade-loss'
          }`}>
            {marginLevel.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
