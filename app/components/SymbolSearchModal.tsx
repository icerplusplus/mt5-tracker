"use client";

import { useState, useEffect } from 'react';
import { Search, X, Star, TrendingUp, TrendingDown } from 'lucide-react';

interface Symbol {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  leverage: string;
  category: 'crypto' | 'forex' | 'commodities';
}

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string) => void;
  currentSymbol?: string;
}

// Mock data - In production, fetch from API
const SYMBOLS: Symbol[] = [
  { symbol: 'BTCUSD', name: 'Bitcoin', price: 77555, change24h: -4.14, volume24h: 428013054.74, leverage: '40x', category: 'crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum', price: 2336.4, change24h: -7.13, volume24h: 419400000, leverage: '20x', category: 'crypto' },
  { symbol: 'SOLUSD', name: 'Solana', price: 101.62, change24h: -6.01, volume24h: 72600000, leverage: '10x', category: 'crypto' },
  { symbol: 'BNBUSD', name: 'BNB', price: 645.23, change24h: 2.34, volume24h: 89500000, leverage: '20x', category: 'crypto' },
  { symbol: 'XRPUSD', name: 'Ripple', price: 2.45, change24h: -3.21, volume24h: 156700000, leverage: '10x', category: 'crypto' },
  { symbol: 'ADAUSD', name: 'Cardano', price: 0.89, change24h: 1.23, volume24h: 45600000, leverage: '10x', category: 'crypto' },
  { symbol: 'DOGUSD', name: 'Dogecoin', price: 0.32, change24h: -2.45, volume24h: 67800000, leverage: '10x', category: 'crypto' },
  { symbol: 'MATICUSD', name: 'Polygon', price: 0.78, change24h: 4.56, volume24h: 34500000, leverage: '10x', category: 'crypto' },
  { symbol: 'EURUSD', name: 'Euro/US Dollar', price: 1.0850, change24h: 0.12, volume24h: 890000000, leverage: '100x', category: 'forex' },
  { symbol: 'GBPUSD', name: 'British Pound/US Dollar', price: 1.2750, change24h: -0.23, volume24h: 567000000, leverage: '100x', category: 'forex' },
  { symbol: 'USDJPY', name: 'US Dollar/Japanese Yen', price: 148.50, change24h: 0.45, volume24h: 678000000, leverage: '100x', category: 'forex' },
  { symbol: 'XAUUSD', name: 'Gold', price: 2050.50, change24h: 1.23, volume24h: 234000000, leverage: '50x', category: 'commodities' },
  { symbol: 'XAGUSD', name: 'Silver', price: 24.50, change24h: -0.89, volume24h: 45000000, leverage: '50x', category: 'commodities' },
];

export default function SymbolSearchModal({ isOpen, onClose, onSelectSymbol, currentSymbol }: SymbolSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');
  const [watchlist, setWatchlist] = useState<string[]>(['BTCUSD', 'ETHUSD', 'EURUSD']);
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [accountSuffix, setAccountSuffix] = useState('m'); // Default to 'm' (dollar account)

  useEffect(() => {
    // Load watchlist from localStorage
    const saved = localStorage.getItem('trading_watchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
    
    // Fetch account suffix from bot status
    fetchAccountSuffix();
  }, []);

  async function fetchAccountSuffix() {
    try {
      const res = await fetch('/api/mt5/bot-status');
      const data = await res.json();
      if (data.success && data.data?.account_suffix) {
        setAccountSuffix(data.data.account_suffix);
        console.log('Account suffix:', data.data.account_suffix);
      }
    } catch (error) {
      console.error('Error fetching account suffix:', error);
    }
  }

  const toggleWatchlist = (symbol: string) => {
    const newWatchlist = watchlist.includes(symbol)
      ? watchlist.filter(s => s !== symbol)
      : [...watchlist, symbol];
    
    setWatchlist(newWatchlist);
    localStorage.setItem('trading_watchlist', JSON.stringify(newWatchlist));
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const filteredSymbols = SYMBOLS
    .map(s => ({
      ...s,
      symbol: s.symbol + accountSuffix // Add account suffix to symbol
    }))
    .filter(s => {
      const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || watchlist.includes(s.symbol);
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'change':
          comparison = a.change24h - b.change24h;
          break;
        case 'volume':
          comparison = a.volume24h - b.volume24h;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}b`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}m`;
    return `$${vol.toFixed(0)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col border border-border-primary">
        {/* Header */}
        <div className="p-4 border-b border-border-primary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Select Symbol</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bg-hover rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coins..."
              className="w-full bg-bg-tertiary border border-border-primary rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-bg-tertiary text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  activeTab === 'watchlist'
                    ? 'bg-bg-tertiary text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Watchlist ({watchlist.length})
              </button>
            </div>
            
            {/* Account Type Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">Account Type:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                accountSuffix === 'm' 
                  ? 'bg-accent/20 text-accent' 
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {accountSuffix === 'm' ? '$ Dollar' : '¢ Cent'}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-bg-secondary border-b border-border-primary">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-text-secondary w-8"></th>
                <th 
                  className="text-left py-3 px-4 font-medium text-text-secondary cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort('symbol')}
                >
                  <div className="flex items-center gap-1">
                    Symbol
                    {sortBy === 'symbol' && (
                      sortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-medium text-text-secondary cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Price
                    {sortBy === 'price' && (
                      sortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-medium text-text-secondary cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort('change')}
                >
                  <div className="flex items-center justify-end gap-1">
                    24h Change
                    {sortBy === 'change' && (
                      sortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-medium text-text-secondary cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center justify-end gap-1">
                    24h Vol
                    {sortBy === 'volume' && (
                      sortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-medium text-text-secondary">Leverage</th>
              </tr>
            </thead>
            <tbody>
              {filteredSymbols.map((symbol) => (
                <tr
                  key={symbol.symbol}
                  onClick={() => {
                    onSelectSymbol(symbol.symbol);
                    onClose();
                  }}
                  className={`border-b border-border-primary hover:bg-bg-hover transition-colors cursor-pointer ${
                    currentSymbol === symbol.symbol ? 'bg-bg-tertiary' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(symbol.symbol);
                      }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          watchlist.includes(symbol.symbol)
                            ? 'fill-accent text-accent'
                            : 'text-text-tertiary'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{symbol.symbol}</div>
                      <div className="text-text-tertiary text-[10px]">{symbol.name}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{symbol.price.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-right font-mono font-semibold ${
                    symbol.change24h >= 0 ? 'text-trade-profit' : 'text-trade-loss'
                  }`}>
                    {symbol.change24h >= 0 ? '+' : ''}{symbol.change24h.toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-text-secondary">
                    {formatVolume(symbol.volume24h)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-semibold">
                      {symbol.leverage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSymbols.length === 0 && (
            <div className="text-center py-12 text-text-tertiary">
              No symbols found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
