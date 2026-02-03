"use client";

import { useTradingStore } from '@/lib/store/trading-store';
import { TrendingUp, TrendingDown, X, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getPusherClient } from '@/lib/pusher/client';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';

interface ChartBar {
  symbol: string;
  timeframe: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function OpenPositions() {
  const { positions, setPositions } = useTradingStore();
  const [closing, setClosing] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [timeframe, setTimeframe] = useState('M5');
  const [chartLoading, setChartLoading] = useState(false);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const priceLinesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  // Format symbol for display
  const formatSymbol = (sym: string) => {
    if (sym.length === 6) {
      return `${sym.slice(0, 3)}/${sym.slice(3)}`;
    }
    return sym;
  };

  // Auto-select first position's symbol
  useEffect(() => {
    if (positions.length > 0 && !selectedSymbol) {
      setSelectedSymbol(positions[0].symbol);
    } else if (positions.length === 0) {
      setSelectedSymbol('');
    }
  }, [positions, selectedSymbol]);

  // Setup Pusher connection
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('mt5-channel');

    // Connection status
    pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected');
      setConnected(true);
    });

    pusher.connection.bind('disconnected', () => {
      console.log('❌ Pusher disconnected');
      setConnected(false);
    });

    // Listen for positions updates
    channel.bind('positions-update', (data: any[]) => {
      console.log('📊 Received positions via Pusher:', data.length);
      setPositions(data);
    });

    // Set initial state
    setConnected(pusher.connection.state === 'connected');

    // Initial load
    loadInitialPositions();

    return () => {
      pusher.connection.unbind('connected');
      pusher.connection.unbind('disconnected');
      channel.unbind('positions-update');
      pusher.unsubscribe('mt5-channel');
    };
  }, [setPositions]);

  // Setup chart
  useEffect(() => {
    if (!chartContainerRef.current || !selectedSymbol) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: '#111827' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#1F2937' },
        horzLines: { color: '#1F2937' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26A69A',
      downColor: '#EF5350',
      borderUpColor: '#26A69A',
      borderDownColor: '#EF5350',
      wickUpColor: '#26A69A',
      wickDownColor: '#EF5350',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Load chart data
    loadChartData();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      priceLinesRef.current.clear();
    };
  }, [selectedSymbol, timeframe]);

  // Update price lines when positions change
  useEffect(() => {
    if (!chartRef.current || !selectedSymbol) return;

    // Clear old price lines
    priceLinesRef.current.forEach(line => {
      chartRef.current?.removeSeries(line);
    });
    priceLinesRef.current.clear();

    // Get positions for selected symbol
    const symbolPositions = positions.filter(p => p.symbol === selectedSymbol);
    
    if (symbolPositions.length === 0) return;

    // Add price lines for each position
    symbolPositions.forEach((pos) => {
      const color = pos.type === 'BUY' ? '#26A69A' : '#EF5350';
      
      // Open price line
      const openLine = chartRef.current!.addLineSeries({
        color: color,
        lineWidth: 2,
        lineStyle: 2, // Dashed
        title: `${pos.type} Open`,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      
      // Current price line
      const currentLine = chartRef.current!.addLineSeries({
        color: '#3B82F6',
        lineWidth: 2,
        title: `Current`,
        priceLineVisible: false,
        lastValueVisible: true,
      });

      priceLinesRef.current.set(`open_${pos.ticket}`, openLine);
      priceLinesRef.current.set(`current_${pos.ticket}`, currentLine);

      // SL line
      if (pos.sl && pos.sl > 0) {
        const slLine = chartRef.current!.addLineSeries({
          color: '#EF4444',
          lineWidth: 1,
          lineStyle: 2,
          title: 'SL',
          priceLineVisible: false,
          lastValueVisible: true,
        });
        priceLinesRef.current.set(`sl_${pos.ticket}`, slLine);
      }

      // TP line
      if (pos.tp && pos.tp > 0) {
        const tpLine = chartRef.current!.addLineSeries({
          color: '#10B981',
          lineWidth: 1,
          lineStyle: 2,
          title: 'TP',
          priceLineVisible: false,
          lastValueVisible: true,
        });
        priceLinesRef.current.set(`tp_${pos.ticket}`, tpLine);
      }
    });

    // Update price line data
    updatePriceLines();
  }, [positions, selectedSymbol]);

  async function loadInitialPositions() {
    try {
      const res = await fetch('/api/mt5/positions');
      const data = await res.json();
      if (data.success) {
        setPositions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  }

  async function loadChartData() {
    if (!selectedSymbol) return;
    
    setChartLoading(true);
    try {
      const res = await fetch(`/api/mt5/chart-data?symbol=${selectedSymbol}&timeframe=${timeframe}&limit=200`);
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        const candlestickData: CandlestickData[] = data.data.map((bar: ChartBar) => ({
          time: new Date(bar.timestamp).getTime() / 1000 as Time,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        }));

        const volumeData = data.data.map((bar: ChartBar) => ({
          time: new Date(bar.timestamp).getTime() / 1000 as Time,
          value: bar.volume,
          color: bar.close >= bar.open ? '#26A69A80' : '#EF535080',
        }));

        candlestickSeriesRef.current?.setData(candlestickData);
        volumeSeriesRef.current?.setData(volumeData);

        // Fit content
        chartRef.current?.timeScale().fitContent();

        // Update price lines
        updatePriceLines();
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setChartLoading(false);
    }
  }

  function updatePriceLines() {
    if (!chartRef.current || !selectedSymbol) return;

    const symbolPositions = positions.filter(p => p.symbol === selectedSymbol);
    
    symbolPositions.forEach(pos => {
      const now = Date.now() / 1000 as Time;
      
      // Update open price line
      const openLine = priceLinesRef.current.get(`open_${pos.ticket}`);
      if (openLine) {
        openLine.update({ time: now, value: pos.open_price });
      }

      // Update current price line
      const currentLine = priceLinesRef.current.get(`current_${pos.ticket}`);
      if (currentLine) {
        currentLine.update({ time: now, value: pos.current_price });
      }

      // Update SL line
      if (pos.sl && pos.sl > 0) {
        const slLine = priceLinesRef.current.get(`sl_${pos.ticket}`);
        if (slLine) {
          slLine.update({ time: now, value: pos.sl });
        }
      }

      // Update TP line
      if (pos.tp && pos.tp > 0) {
        const tpLine = priceLinesRef.current.get(`tp_${pos.ticket}`);
        if (tpLine) {
          tpLine.update({ time: now, value: pos.tp });
        }
      }
    });
  }

  async function handleClosePosition(ticket: number) {
    if (!confirm('Bạn có chắc muốn đóng lệnh này?')) return;

    setClosing(ticket);
    try {
      const res = await fetch('/api/commands/close-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket })
      });

      const data = await res.json();
      if (data.success) {
        alert('Lệnh đóng đã được gửi! Chờ EA Bot xử lý...');
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      console.error('Error closing position:', error);
      alert('Có lỗi xảy ra khi gửi lệnh đóng');
    } finally {
      setClosing(null);
    }
  }

  return (
    <>
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Lệnh Đang Mở ({positions.length})</h2>
          <div className="flex items-center gap-2">
            {/* WebSocket status indicator */}
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${
              connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {connected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        {positions.length > 0 && selectedSymbol && (
          <div className="mb-6 border border-gray-800 rounded-lg overflow-hidden">
            {/* Chart Header */}
            <div className="bg-gray-800/50 px-4 py-3 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold">{formatSymbol(selectedSymbol)}</h3>
                
                {/* Symbol Selector */}
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {Array.from(new Set(positions.map(p => p.symbol))).map(symbol => (
                    <option key={symbol} value={symbol}>
                      {formatSymbol(symbol)}
                    </option>
                  ))}
                </select>

                {/* Timeframe Selector */}
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="M1">M1</option>
                  <option value="M5">M5</option>
                  <option value="M15">M15</option>
                  <option value="M30">M30</option>
                  <option value="H1">H1</option>
                  <option value="H4">H4</option>
                  <option value="D1">D1</option>
                </select>
              </div>

              {/* Position Info for selected symbol */}
              <div className="flex items-center gap-4 text-sm">
                {positions.filter(p => p.symbol === selectedSymbol).map(pos => (
                  <div key={pos.ticket} className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      pos.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {pos.type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {pos.type}
                    </span>
                    <span className={`font-semibold ${pos.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${pos.profit.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div ref={chartContainerRef} className="relative bg-gray-950">
              {chartLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-950/50 z-10">
                  <div className="text-gray-400 text-sm">Loading chart...</div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="bg-gray-800/30 px-4 py-2 flex items-center gap-6 text-xs border-t border-gray-800">
              {positions.filter(p => p.symbol === selectedSymbol).map(pos => (
                <div key={pos.ticket} className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-0.5 ${pos.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`} style={{ borderStyle: 'dashed' }}></div>
                    <span className="text-gray-400">Open: {pos.open_price.toFixed(5)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-blue-500"></div>
                    <span className="text-gray-400">Current: {pos.current_price.toFixed(5)}</span>
                  </div>
                  {pos.sl && pos.sl > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }}></div>
                      <span className="text-gray-400">SL: {pos.sl.toFixed(5)}</span>
                    </div>
                  )}
                  {pos.tp && pos.tp > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-green-500" style={{ borderStyle: 'dashed' }}></div>
                      <span className="text-gray-400">TP: {pos.tp.toFixed(5)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Positions Table */}
        {positions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Không có lệnh nào đang mở</p>
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
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Current</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Profit</th>
                  <th className="text-center py-3 px-2 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.ticket} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-2 font-mono text-gray-300">{pos.ticket}</td>
                    <td className="py-3 px-2 font-semibold">{pos.symbol}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        pos.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {pos.type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {pos.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">{pos.volume.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-mono text-gray-400">{pos.open_price.toFixed(5)}</td>
                    <td className="py-3 px-2 text-right font-mono transition-colors duration-300">
                      {pos.current_price.toFixed(5)}
                    </td>
                    <td className={`py-3 px-2 text-right font-bold transition-all duration-300 ${
                      pos.profit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span className="inline-block">
                        ${pos.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleClosePosition(pos.ticket)}
                        disabled={closing === pos.ticket}
                        className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Đóng lệnh"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
