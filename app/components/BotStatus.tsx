"use client";

import { useState } from 'react';
import { useTradingStore } from '@/lib/store/trading-store';
import { Activity, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import TradingChart from './TradingChart';

export default function BotStatus() {
  const { botStatus } = useTradingStore();
  const [showChart, setShowChart] = useState(false);

  if (!botStatus) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Trạng Thái Bot</h2>
        <p className="text-gray-500 text-center py-8">Chưa kết nối</p>
      </div>
    );
  }

  const statusConfig = {
    RUNNING: { label: 'Đang chạy', color: 'bg-green-500', textColor: 'text-green-400' },
    PAUSED: { label: 'Tạm dừng', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
    STOPPED: { label: 'Đã dừng', color: 'bg-red-500', textColor: 'text-red-400' }
  };

  const config = statusConfig[botStatus.status] || statusConfig.STOPPED;

  return (
    <>
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Trạng Thái Bot</h2>
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            {showChart ? 'Ẩn Chart' : 'Hiện Chart'}
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse`}></div>
            <span className={`text-lg font-semibold ${config.textColor}`}>{config.label}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Cập nhật: {formatDistanceToNow(new Date(botStatus.last_heartbeat), { addSuffix: true, locale: vi })}</span>
            </div>
            
            {botStatus.version && (
              <div className="flex items-center gap-2 text-gray-400">
                <Activity className="w-4 h-4" />
                <span>Version: {botStatus.version}</span>
              </div>
            )}

            {botStatus.account_number && (
              <div className="text-gray-400">
                <span>Account: {botStatus.account_number}</span>
              </div>
            )}

            {botStatus.broker && (
              <div className="text-gray-400">
                <span>Broker: {botStatus.broker}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showChart && (
        <div className="lg:col-span-3">
          <TradingChart />
        </div>
      )}
    </>
  );
}
