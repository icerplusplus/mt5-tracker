"use client";

import { useState } from 'react';
import { useTradingStore } from '@/lib/store/trading-store';
import { Play, Pause, Square } from 'lucide-react';

export default function BotControls() {
  const { botStatus } = useTradingStore();
  const [loading, setLoading] = useState(false);

  async function handleControl(action: 'PAUSE' | 'RESUME') {
    setLoading(true);
    try {
      const res = await fetch('/api/commands/bot-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Lệnh ${action === 'PAUSE' ? 'tạm dừng' : 'tiếp tục'} đã được gửi!`);
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      console.error('Error controlling bot:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  const isRunning = botStatus?.status === 'RUNNING';
  const isPaused = botStatus?.status === 'PAUSED';

  return (
    <div className="flex items-center gap-2">
      {isPaused && (
        <button
          onClick={() => handleControl('RESUME')}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-4 h-4" />
          Tiếp Tục
        </button>
      )}
      
      {isRunning && (
        <button
          onClick={() => handleControl('PAUSE')}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Pause className="w-4 h-4" />
          Tạm Dừng
        </button>
      )}
    </div>
  );
}
