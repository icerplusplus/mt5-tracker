"use client";

import { useTradingStore } from '@/lib/store/trading-store';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

export default function TradeHistory() {
  const { recentTrades } = useTradingStore();

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold mb-4">Lịch Sử Giao Dịch ({recentTrades.length})</h2>
      
      {recentTrades.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Chưa có giao dịch nào</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-2 text-gray-400 font-medium">Ticket</th>
                <th className="text-left py-3 px-2 text-gray-400 font-medium">Symbol</th>
                <th className="text-left py-3 px-2 text-gray-400 font-medium">Type</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Volume</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Open</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Close</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Profit</th>
                <th className="text-left py-3 px-2 text-gray-400 font-medium">Close Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade) => (
                <tr key={trade.ticket} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-2 font-mono text-gray-300">{trade.ticket}</td>
                  <td className="py-3 px-2 font-semibold">{trade.symbol}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {trade.type}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-mono">{trade.volume.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right font-mono text-gray-400">{trade.open_price.toFixed(5)}</td>
                  <td className="py-3 px-2 text-right font-mono text-gray-400">
                    {trade.close_price ? trade.close_price.toFixed(5) : '-'}
                  </td>
                  <td className={`py-3 px-2 text-right font-bold ${
                    (trade.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${(trade.profit || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-gray-400">
                    {trade.close_time ? format(new Date(trade.close_time), 'dd/MM/yyyy HH:mm') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
