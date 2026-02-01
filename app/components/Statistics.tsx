"use client";

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react';

export default function Statistics() {
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('DAILY');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [period]);

  async function loadStatistics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/statistics?period=${period}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Thống Kê</h2>
        <p className="text-gray-500 text-center py-8">Đang tải...</p>
      </div>
    );
  }

  const pieData = [
    { name: 'Win', value: stats.winning_trades, color: '#10b981' },
    { name: 'Loss', value: stats.losing_trades, color: '#ef4444' }
  ];

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Thống Kê</h2>
        <div className="flex gap-2">
          {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {p === 'DAILY' ? 'Ngày' : p === 'WEEKLY' ? 'Tuần' : p === 'MONTHLY' ? 'Tháng' : 'Năm'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Tổng Lệnh</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{stats.total_trades}</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.win_rate.toFixed(1)}%</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Net Profit</span>
          </div>
          <p className={`text-2xl font-bold ${stats.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.net_profit.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Profit Factor</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{stats.profit_factor.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Win/Loss Chart */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-4">Win/Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-400">Win: {stats.winning_trades}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-400">Loss: {stats.losing_trades}</span>
            </div>
          </div>
        </div>

        {/* Profit/Loss Chart */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-4">Profit vs Loss</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Profit', value: stats.total_profit },
              { name: 'Loss', value: stats.total_loss }
            ]}>
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Avg Profit:</span>
          <span className="ml-2 text-gray-200">${stats.average_profit.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-400">Max Drawdown:</span>
          <span className="ml-2 text-red-400">${stats.max_drawdown.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-400">Total Profit:</span>
          <span className="ml-2 text-green-400">${stats.total_profit.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-400">Total Loss:</span>
          <span className="ml-2 text-red-400">${stats.total_loss.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
