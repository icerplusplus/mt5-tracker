"use client";

import { useTradingStore } from '@/lib/store/trading-store';

export default function MobileStatsBar() {
  const { positions } = useTradingStore();
  
  // Mock data - In production, fetch from API
  const stats = {
    markPrice: 77102,
    oracle: 77102,
    change24h: -4.57,
    volume24h: 446447428.30,
    openInterest: 12000000
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}b`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}m`;
    return `$${vol.toFixed(0)}`;
  };

  return (
    <div className="lg:hidden bg-bg-secondary border-b border-border-primary px-4 py-2 overflow-x-auto">
      <div className="flex items-center gap-6 min-w-max text-xs">
        <div>
          <div className="text-text-tertiary text-[10px]">Mark Price</div>
          <div className="font-mono font-semibold">{stats.markPrice.toLocaleString()}</div>
        </div>
        
        <div>
          <div className="text-text-tertiary text-[10px]">Oracle</div>
          <div className="font-mono font-semibold">{stats.oracle.toLocaleString()}</div>
        </div>
        
        <div>
          <div className="text-text-tertiary text-[10px]">24h Change</div>
          <div className={`font-mono font-semibold ${
            stats.change24h >= 0 ? 'text-trade-profit' : 'text-trade-loss'
          }`}>
            {stats.change24h >= 0 ? '+' : ''}{stats.change24h.toFixed(2)}%
          </div>
        </div>
        
        <div>
          <div className="text-text-tertiary text-[10px]">24h Volume</div>
          <div className="font-mono font-semibold">{formatVolume(stats.volume24h)}</div>
        </div>
        
        <div>
          <div className="text-text-tertiary text-[10px]">Open Interest</div>
          <div className="font-mono font-semibold">{formatVolume(stats.openInterest)}</div>
        </div>
      </div>
    </div>
  );
}
