"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CompactOrderFormProps {
  defaultSymbol?: string;
}

export default function CompactOrderForm({ defaultSymbol }: CompactOrderFormProps) {
  const [formData, setFormData] = useState({
    symbol: defaultSymbol || 'BTCUSDm',
    type: 'BUY' as 'BUY' | 'SELL',
    volume: '0.01',
    sl: '',
    tp: '',
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Update symbol when defaultSymbol prop changes
  useEffect(() => {
    if (defaultSymbol) {
      setFormData(prev => ({ ...prev, symbol: defaultSymbol }));
    }
  }, [defaultSymbol]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.symbol || !formData.volume) {
      alert('Please fill required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/commands/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: formData.symbol,
          type: formData.type,
          volume: parseFloat(formData.volume),
          sl: formData.sl ? parseFloat(formData.sl) : undefined,
          tp: formData.tp ? parseFloat(formData.tp) : undefined,
          comment: formData.comment || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Order sent!');
        setFormData({ ...formData, comment: '' });
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-4">New Order</h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Symbol */}
        <div>
          <label className="block text-xs text-text-secondary mb-1">Symbol</label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            className="w-full bg-bg-tertiary border border-border-primary rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
            placeholder="BTCUSDm"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs text-text-secondary mb-1">Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'BUY' })}
              className={`flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-colors ${
                formData.type === 'BUY'
                  ? 'bg-trade-buy text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              BUY
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'SELL' })}
              className={`flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition-colors ${
                formData.type === 'SELL'
                  ? 'bg-trade-sell text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              SELL
            </button>
          </div>
        </div>

        {/* Volume */}
        <div>
          <label className="block text-xs text-text-secondary mb-1">Volume (Lots)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.volume}
            onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
            className="w-full bg-bg-tertiary border border-border-primary rounded px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent transition-colors"
            placeholder="0.01"
          />
        </div>

        {/* SL & TP */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Stop Loss</label>
            <input
              type="number"
              step="0.00001"
              value={formData.sl}
              onChange={(e) => setFormData({ ...formData, sl: e.target.value })}
              className="w-full bg-bg-tertiary border border-border-primary rounded px-2 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-accent transition-colors"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Take Profit</label>
            <input
              type="number"
              step="0.00001"
              value={formData.tp}
              onChange={(e) => setFormData({ ...formData, tp: e.target.value })}
              className="w-full bg-bg-tertiary border border-border-primary rounded px-2 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-accent transition-colors"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-xs text-text-secondary mb-1">Comment</label>
          <input
            type="text"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className="w-full bg-bg-tertiary border border-border-primary rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
            placeholder="Optional"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent hover:bg-accent-light text-bg-primary py-2.5 rounded font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Sending...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
