"use client";

import { useTradingStore } from '@/lib/store/trading-store';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function AccountInfo() {
  const { accountInfo } = useTradingStore();

  if (!accountInfo) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Thông Tin Tài Khoản</h2>
        <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Balance',
      value: `$${accountInfo.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'text-blue-400'
    },
    {
      label: 'Equity',
      value: `$${accountInfo.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      label: 'Profit',
      value: `$${accountInfo.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: accountInfo.profit >= 0 ? TrendingUp : TrendingDown,
      color: accountInfo.profit >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      label: 'Margin Level',
      value: accountInfo.margin_level ? `${accountInfo.margin_level.toFixed(2)}%` : 'N/A',
      icon: Wallet,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold mb-4">Thông Tin Tài Khoản</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-sm text-gray-400">{stat.label}</span>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Margin:</span>
          <span className="ml-2 text-gray-200">${accountInfo.margin.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div>
          <span className="text-gray-400">Free Margin:</span>
          <span className="ml-2 text-gray-200">${accountInfo.free_margin.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}
