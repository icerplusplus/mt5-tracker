"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, IPriceLine } from 'lightweight-charts';
import { getPusherClient } from '@/lib/pusher/client';
import { useTradingStore } from '@/lib/store/trading-store';

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

interface TradingChartProps {
  symbol?: string;
}

export default function TradingChart({ symbol: propSymbol }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const currentCandleRef = useRef<CandlestickData | null>(null);
  const currentPriceRef = useRef<number | null>(null);
  const currentPriceLineRef = useRef<IPriceLine | null>(null);
  
  const [symbol, setSymbol] = useState(propSymbol || 'BTCUSD');
  const [timeframe, setTimeframe] = useState('H1'); // Default H1
  const [loading, setLoading] = useState(true);
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
  const timeframeMenuRef = useRef<HTMLDivElement>(null);
  
  const { positions, subscription } = useTradingStore();
  
  // Get slippage mode from subscription
  const slippageMode = subscription?.slippageMode || 'high';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeframeMenuRef.current && !timeframeMenuRef.current.contains(event.target as Node)) {
        setShowTimeframeMenu(false);
      }
    }
    
    if (showTimeframeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTimeframeMenu]);

  // Update symbol when prop changes and reload data
  useEffect(() => {
    if (propSymbol && propSymbol !== symbol) {
      setSymbol(propSymbol);
      // Data will be loaded by the next effect when symbol changes
    }
  }, [propSymbol, symbol]);

  // Memoize requestChartDataFromBot to prevent unnecessary re-renders
  const requestChartDataFromBot = useCallback(async () => {
    try {
      await fetch('/api/commands/request-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe })
      });
      console.log('Requested chart data for:', symbol, timeframe);
    } catch (error) {
      console.error('Error requesting chart data:', error);
    }
  }, [symbol, timeframe]);

  // Memoize loadChartData to prevent unnecessary re-renders
  const loadChartData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mt5/chart-data?symbol=${symbol}&timeframe=${timeframe}&limit=200`);
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
          color: bar.close >= bar.open ? '#10B98180' : '#EF444480',
        }));

        candlestickSeriesRef.current?.setData(candlestickData);
        volumeSeriesRef.current?.setData(volumeData);

        // Fit content
        chartRef.current?.timeScale().fitContent();
        
        // Draw position lines after chart is loaded
        drawPositionLines();
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]); // Add dependencies

  // Load data when symbol changes
  useEffect(() => {
    if (chartRef.current && candlestickSeriesRef.current && volumeSeriesRef.current) {
      loadChartData();
      // Request chart data from EA Bot for the new symbol
      requestChartDataFromBot();
    }
  }, [symbol, loadChartData, requestChartDataFromBot]); // Add function dependencies

  // Load data when timeframe changes
  useEffect(() => {
    if (chartRef.current && candlestickSeriesRef.current && volumeSeriesRef.current) {
      loadChartData();
      requestChartDataFromBot();
    }
  }, [timeframe, loadChartData, requestChartDataFromBot]); // Add function dependencies

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with dynamic height
    const containerHeight = chartContainerRef.current.clientHeight;
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: containerHeight,
      layout: {
        background: { color: '#000000' },
        textColor: '#6B7280',
      },
      grid: {
        vertLines: { color: '#1A1A1A' },
        horzLines: { color: '#1A1A1A' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#1A1A1A',
      },
      timeScale: {
        borderColor: '#1A1A1A',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
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
        const containerHeight = chartContainerRef.current.clientHeight;
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: containerHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Load initial data
    loadChartData();

    // Setup Pusher for real-time chart updates
    const pusher = getPusherClient();
    const channel = pusher.subscribe('mt5-channel');
    
    const handleChartUpdate = (data: any) => {
      if (data.symbol === symbol && data.timeframe === timeframe) {
        updateChart(data);
      }
    };
    
    const handleTickUpdate = (tick: any) => {
      // Update candle for ANY tick of the current symbol (ignore timeframe mismatch)
      // The chart will calculate the correct bar time based on current timeframe
      if (tick.symbol === symbol) {
        updateCurrentCandle(tick);
      }
    };
    
    channel.bind('chart-update', handleChartUpdate);
    channel.bind('tick-update', handleTickUpdate);

    return () => {
      window.removeEventListener('resize', handleResize);
      channel.unbind('chart-update', handleChartUpdate);
      channel.unbind('tick-update', handleTickUpdate);
      pusher.unsubscribe('mt5-channel');
      chart.remove();
    };
  }, [symbol, timeframe]);

  function updateChart(bar: ChartBar) {
    const candlestickData: CandlestickData = {
      time: new Date(bar.timestamp).getTime() / 1000 as Time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    };

    const volumeData = {
      time: new Date(bar.timestamp).getTime() / 1000 as Time,
      value: bar.volume,
      color: bar.close >= bar.open ? '#10B98180' : '#EF444480',
    };

    candlestickSeriesRef.current?.update(candlestickData);
    volumeSeriesRef.current?.update(volumeData);
    
    // Store current candle for tick updates
    currentCandleRef.current = candlestickData;
  }

  function updateCurrentCandle(tick: any) {
    if (!candlestickSeriesRef.current) return;

    const currentPrice = tick.price;
    const now = new Date(tick.timestamp || Date.now());
    const barTime = getBarTime(now, timeframe) / 1000 as Time;
    
    // Log tick updates for debugging (every 5 seconds to avoid spam)
    const logInterval = 5000; // 5 seconds
    const lastLogTime = (window as any).__lastTickLogTime || 0;
    if (Date.now() - lastLogTime > logInterval) {
      console.log(`🕐 Tick Update: ${tick.symbol} @ ${currentPrice.toFixed(5)} | Timeframe: ${timeframe} | Bar Time: ${new Date((barTime as number) * 1000).toLocaleTimeString()}`);
      (window as any).__lastTickLogTime = Date.now();
    }
    
    // Store current price for position lines
    currentPriceRef.current = currentPrice;
    
    // Get or initialize current candle
    let candle = currentCandleRef.current;
    
    if (!candle || candle.time !== barTime) {
      // New candle - initialize with current price
      candle = {
        time: barTime,
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
      };
    } else {
      // Update existing candle
      candle = {
        time: barTime,
        open: candle.open,
        high: Math.max(candle.high, currentPrice),
        low: Math.min(candle.low, currentPrice),
        close: currentPrice,
      };
    }
    
    // Update chart
    candlestickSeriesRef.current.update(candle);
    currentCandleRef.current = candle;
    
    // Update current price line for positions (realtime)
    updateCurrentPriceLine(currentPrice);
  }
  
  function updateCurrentPriceLine(price: number) {
    if (!candlestickSeriesRef.current) return;
    
    // Check if we have positions for this symbol
    const symbolPositions = positions.filter(pos => pos.symbol === symbol);
    if (symbolPositions.length === 0) {
      // No positions, remove current price line if exists
      if (currentPriceLineRef.current) {
        candlestickSeriesRef.current.removePriceLine(currentPriceLineRef.current);
        currentPriceLineRef.current = null;
      }
      return;
    }
    
    // Apply slippage based on mode
    const slippedPrice = applySlippage(price, slippageMode);
    
    // Log slippage for debugging
    const slippagePips = Math.abs((slippedPrice - price) / 0.00001);
    console.log(`💱 Slippage Mode: ${slippageMode.toUpperCase()} | Original: ${price.toFixed(5)} | Slipped: ${slippedPrice.toFixed(5)} | Diff: ${slippagePips.toFixed(1)} pips`);
    
    // Remove old current price line
    if (currentPriceLineRef.current) {
      candlestickSeriesRef.current.removePriceLine(currentPriceLineRef.current);
    }
    
    // Create new current price line with slipped price
    const currentLine = candlestickSeriesRef.current.createPriceLine({
      price: slippedPrice,
      color: '#FFC107',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: 'Current',
    });
    
    currentPriceLineRef.current = currentLine;
  }
  
  function applySlippage(price: number, mode: 'zero' | 'low' | 'medium' | 'high'): number {
    // Calculate pip value (assuming 5 decimal places for forex)
    const pipValue = 0.00001;
    
    let slippagePips = 0;
    
    switch (mode) {
      case 'zero':
        slippagePips = 0;
        break;
      case 'low':
        // Random slippage between 1-2 pips
        slippagePips = 1 + Math.random() * 1;
        break;
      case 'medium':
        // Random slippage between 3-5 pips
        slippagePips = 3 + Math.random() * 2;
        break;
      case 'high':
        // Random slippage between 5-10 pips
        slippagePips = 5 + Math.random() * 5;
        break;
    }
    
    // Apply slippage (randomly positive or negative)
    const direction = Math.random() > 0.5 ? 1 : -1;
    const slippage = slippagePips * pipValue * direction;
    
    return price + slippage;
  }

  function getBarTime(date: Date, tf: string): number {
    const time = date.getTime();
    
    // Get timeframe in milliseconds
    let tfMs = 0;
    if (tf === 'M1') tfMs = 60 * 1000;
    else if (tf === 'M5') tfMs = 5 * 60 * 1000;
    else if (tf === 'M15') tfMs = 15 * 60 * 1000;
    else if (tf === 'M30') tfMs = 30 * 60 * 1000;
    else if (tf === 'H1') tfMs = 60 * 60 * 1000;
    else if (tf === 'H2') tfMs = 2 * 60 * 60 * 1000;
    else if (tf === 'H4') tfMs = 4 * 60 * 60 * 1000;
    else if (tf === 'H8') tfMs = 8 * 60 * 60 * 1000;
    else if (tf === 'H12') tfMs = 12 * 60 * 60 * 1000;
    else if (tf === 'D1') tfMs = 24 * 60 * 60 * 1000;
    else if (tf === 'W1') tfMs = 7 * 24 * 60 * 60 * 1000;
    else if (tf === 'MN1') tfMs = 30 * 24 * 60 * 60 * 1000;
    else tfMs = 60 * 60 * 1000; // Default H1
    
    // Round down to nearest bar time
    return Math.floor(time / tfMs) * tfMs;
  }

  // Memoize drawPositionLines to prevent unnecessary re-renders
  const drawPositionLines = useCallback(() => {
    if (!candlestickSeriesRef.current) return;

    // Remove old price lines (except current price line which is managed separately)
    priceLinesRef.current.forEach(line => {
      candlestickSeriesRef.current?.removePriceLine(line);
    });
    priceLinesRef.current = [];

    // Filter positions for current symbol
    const symbolPositions = positions.filter(pos => pos.symbol === symbol);

    // Draw price lines for each position
    symbolPositions.forEach(position => {
      const series = candlestickSeriesRef.current;
      if (!series) return;

      // Open Price Line
      const openLine = series.createPriceLine({
        price: position.open_price,
        color: position.type === 'BUY' ? '#10B981' : '#EF4444',
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: `${position.type} ${position.volume}`,
      });
      priceLinesRef.current.push(openLine);

      // Stop Loss Line
      if (position.sl && position.sl > 0) {
        const slLine = series.createPriceLine({
          price: position.sl,
          color: '#EF4444',
          lineWidth: 1,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: 'SL',
        });
        priceLinesRef.current.push(slLine);
      }

      // Take Profit Line
      if (position.tp && position.tp > 0) {
        const tpLine = series.createPriceLine({
          price: position.tp,
          color: '#10B981',
          lineWidth: 1,
          lineStyle: 1, // Dotted
          axisLabelVisible: true,
          title: 'TP',
        });
        priceLinesRef.current.push(tpLine);
      }
    });
    
    // Update current price line with latest tick price if available
    if (currentPriceRef.current !== null) {
      updateCurrentPriceLine(currentPriceRef.current);
    }
  }, [positions, symbol]); // Add dependencies

  // Update position lines when positions change
  useEffect(() => {
    if (candlestickSeriesRef.current) {
      drawPositionLines();
    }
  }, [positions, symbol, drawPositionLines]); // Add drawPositionLines dependency

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-primary h-full flex flex-col">
      {/* Chart Header with Timeframe Selector */}
      <div className="px-4 py-2 border-b border-border-primary flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Symbol */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{symbol}</span>
          </div>
          
          {/* Slippage Mode Badge */}
          <div className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            slippageMode === 'zero' ? 'bg-green-500/20 text-green-400' :
            slippageMode === 'low' ? 'bg-blue-500/20 text-blue-400' :
            slippageMode === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {slippageMode === 'zero' ? '⚡ ZERO' :
             slippageMode === 'low' ? '🔹 LOW' :
             slippageMode === 'medium' ? '🔸 MEDIUM' :
             '🔴 HIGH'} SLIPPAGE
          </div>
          
          {/* Timeframe Quick Buttons */}
          <div className="flex items-center gap-1">
            {['M5', 'M15', 'H1', 'H4', 'D1', 'W1'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-accent text-bg-primary'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                {tf === 'M5' ? '5m' : tf === 'M15' ? '15m' : tf === 'H1' ? '1h' : tf === 'H4' ? '4h' : tf === 'D1' ? 'D' : 'W'}
              </button>
            ))}
            
            {/* More Timeframes Dropdown */}
            <div className="relative" ref={timeframeMenuRef}>
              <button
                onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
                className="px-2 py-1 text-xs text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
              >
                ▼
              </button>
              
              {showTimeframeMenu && (
                <div className="absolute top-full left-0 mt-1 bg-bg-tertiary border border-border-primary rounded-lg shadow-xl z-50 min-w-[160px]">
                  {/* MINUTES */}
                  <div className="p-2 border-b border-border-primary">
                    <div className="text-[10px] text-text-tertiary uppercase mb-1 px-2">Minutes</div>
                    {[
                      { value: 'M1', label: '1 minute' },
                      { value: 'M5', label: '5 minutes' },
                      { value: 'M15', label: '15 minutes' },
                      { value: 'M30', label: '30 minutes' }
                    ].map((tf) => (
                      <button
                        key={tf.value}
                        onClick={() => {
                          setTimeframe(tf.value);
                          setShowTimeframeMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between ${
                          timeframe === tf.value
                            ? 'bg-accent/20 text-accent'
                            : 'text-text-primary hover:bg-bg-hover'
                        }`}
                      >
                        {tf.label}
                        {timeframe === tf.value && <span className="text-accent">★</span>}
                      </button>
                    ))}
                  </div>
                  
                  {/* HOURS */}
                  <div className="p-2 border-b border-border-primary">
                    <div className="text-[10px] text-text-tertiary uppercase mb-1 px-2">Hours</div>
                    {[
                      { value: 'H1', label: '1 hour' },
                      { value: 'H2', label: '2 hours' },
                      { value: 'H4', label: '4 hours' },
                      { value: 'H8', label: '8 hours' },
                      { value: 'H12', label: '12 hours' }
                    ].map((tf) => (
                      <button
                        key={tf.value}
                        onClick={() => {
                          setTimeframe(tf.value);
                          setShowTimeframeMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between ${
                          timeframe === tf.value
                            ? 'bg-accent/20 text-accent'
                            : 'text-text-primary hover:bg-bg-hover'
                        }`}
                      >
                        {tf.label}
                        {timeframe === tf.value && <span className="text-accent">★</span>}
                      </button>
                    ))}
                  </div>
                  
                  {/* DAYS */}
                  <div className="p-2">
                    <div className="text-[10px] text-text-tertiary uppercase mb-1 px-2">Days</div>
                    {[
                      { value: 'D1', label: '1 day' },
                      { value: 'D3', label: '3 days' },
                      { value: 'W1', label: '1 week' },
                      { value: 'MN1', label: '1 month' }
                    ].map((tf) => (
                      <button
                        key={tf.value}
                        onClick={() => {
                          setTimeframe(tf.value);
                          setShowTimeframeMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between ${
                          timeframe === tf.value
                            ? 'bg-accent/20 text-accent'
                            : 'text-text-primary hover:bg-bg-hover'
                        }`}
                      >
                        {tf.label}
                        {timeframe === tf.value && <span className="text-accent">★</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
            <span className="text-xs text-text-tertiary">Loading...</span>
          </div>
        )}
      </div>
      
      {/* Chart Container */}
      <div ref={chartContainerRef} className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary/50 z-10">
            <div className="text-text-tertiary text-sm">Loading chart data for {symbol}...</div>
          </div>
        )}
      </div>
    </div>
  );
}
