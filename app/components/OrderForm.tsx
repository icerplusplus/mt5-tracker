"use client";

import { useState } from 'react';
import { TrendingUp, TrendingDown, Send } from 'lucide-react';

export default function OrderForm() {
  const [formData, setFormData] = useState({
    symbol: 'BTCUSDm',
    type: 'BUY' as 'BUY' | 'SELL',
    volume: '0.01',
    sl: '',
    tp: '',
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.symbol || !formData.volume) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        symbol: formData.symbol,
        type: formData.type,
        volume: parseFloat(formData.volume),
        sl: formData.sl ? parseFloat(formData.sl) : undefined,
        tp: formData.tp ? parseFloat(formData.tp) : undefined,
        comment: formData.comment || undefined
      };
      
      console.log('📤 Sending order payload:', payload);
      
      const res = await fetch('/api/commands/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        alert('Lệnh đã được gửi! Chờ EA Bot xử lý...');
        setFormData({ ...formData, comment: '' });
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Có lỗi xảy ra khi gửi lệnh');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-lg font-semibold mb-4">Đặt Lệnh Mới</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Symbol */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Symbol</label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="BTCUSDm"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Loại Lệnh</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'BUY' })}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                formData.type === 'BUY'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              BUY
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'SELL' })}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                formData.type === 'SELL'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              SELL
            </button>
          </div>
        </div>

        {/* Volume */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Volume (Lots)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.volume}
            onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="0.01"
          />
        </div>

        {/* SL & TP */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Stop Loss</label>
            <input
              type="number"
              step="0.00001"
              value={formData.sl}
              onChange={(e) => setFormData({ ...formData, sl: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Take Profit</label>
            <input
              type="number"
              step="0.00001"
              value={formData.tp}
              onChange={(e) => setFormData({ ...formData, tp: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Comment</label>
          <input
            type="text"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Optional"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Đang gửi...' : 'Gửi Lệnh'}
        </button>
      </form>
    </div>
  );
}
