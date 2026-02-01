"use client";

import { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';

export default function CommandManager() {
  const [clearing, setClearing] = useState(false);

  async function clearOldCommands() {
    if (!confirm('Xóa tất cả lệnh cũ (> 1 giờ)?')) return;
    
    setClearing(true);
    try {
      const res = await fetch('/api/commands/clear', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ Đã xóa ${data.data?.length || 0} lệnh cũ`);
      } else {
        alert('❌ Lỗi: ' + data.error);
      }
    } catch (error) {
      console.error('Error clearing commands:', error);
      alert('❌ Có lỗi xảy ra');
    } finally {
      setClearing(false);
    }
  }

  async function cancelAllPending() {
    if (!confirm('⚠️ Hủy TẤT CẢ lệnh đang chờ?')) return;
    
    setClearing(true);
    try {
      const res = await fetch('/api/commands/clear', { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ Đã hủy ${data.data?.length || 0} lệnh`);
      } else {
        alert('❌ Lỗi: ' + data.error);
      }
    } catch (error) {
      console.error('Error cancelling commands:', error);
      alert('❌ Có lỗi xảy ra');
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">Quản Lý Lệnh</h2>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={clearOldCommands}
          disabled={clearing}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Xóa Lệnh Cũ (&gt; 1 giờ)
        </button>

        <button
          onClick={cancelAllPending}
          disabled={clearing}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Hủy Tất Cả Lệnh Chờ
        </button>

        <p className="text-xs text-gray-500 mt-2">
          💡 Nếu EA Bot nhận lệnh cũ, dùng "Hủy Tất Cả" để reset
        </p>
      </div>
    </div>
  );
}
