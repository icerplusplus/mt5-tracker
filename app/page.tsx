"use client";

import { useEffect, useState } from 'react';
import { useTradingStore } from '@/lib/store/trading-store';
import { supabase } from '@/lib/supabase/client';
import { getPusherClient } from '@/lib/pusher/client';
import TradingLayout from './components/TradingLayout';
import TradingHeader from './components/TradingHeader';
import CompactPositions from './components/CompactPositions';
import CompactOrderForm from './components/CompactOrderForm';
import CompactAccountInfo from './components/CompactAccountInfo';
import TradingChart from './components/TradingChart';
import SymbolSearchModal from './components/SymbolSearchModal';
import SubscriptionPlansPage from './components/SubscriptionPlansPage';
import { Activity } from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isPlansPageOpen, setIsPlansPageOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [accountSuffix, setAccountSuffix] = useState('m'); // Default to 'm'
  const { setPositions, setAccountInfo, setBotStatus, setRecentTrades } = useTradingStore();

  useEffect(() => {
    loadInitialData();
    setupPusherSubscriptions();
  }, []);

  async function loadInitialData() {
    try {
      // Load bot status first to get account type
      const botRes = await fetch('/api/mt5/bot-status');
      const botData = await botRes.json();
      
      if (botData.success && botData.data) {
        setBotStatus(botData.data);
        
        // Check if bot has sent data (has account_number)
        if (botData.data.account_number) {
          // Bot is connected
          const suffix = botData.data.account_suffix || 'm'; // Default to 'm' if not set
          setAccountSuffix(suffix);
          setSelectedSymbol('BTCUSD' + suffix); // Set default symbol with suffix
          
          // Load other data
          await loadOtherData();
          setLoading(false);
        } else {
          // Bot not connected yet, wait for bot status update
          console.log('Waiting for EA Bot to connect...');
          // Keep loading state, will be updated by Pusher subscription
        }
      } else {
        // No bot status yet, wait for bot to connect
        console.log('No bot status found, waiting for EA Bot...');
        // Keep loading state
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Still show loading, don't fail
    }
  }

  async function loadOtherData() {
    try {
      // Load positions
      const posRes = await fetch('/api/mt5/positions');
      const posData = await posRes.json();
      if (posData.success) setPositions(posData.data || []);

      // Load account info
      const accRes = await fetch('/api/mt5/account-info');
      const accData = await accRes.json();
      if (accData.success && accData.data) setAccountInfo(accData.data);

      // Load recent trades
      const tradesRes = await fetch('/api/mt5/trades?limit=20');
      const tradesData = await tradesRes.json();
      if (tradesData.success) setRecentTrades(tradesData.data || []);
    } catch (error) {
      console.error('Error loading other data:', error);
    }
  }

  function setupPusherSubscriptions() {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('mt5-channel');

    // Listen to positions updates
    channel.bind('positions-update', (data: any) => {
      console.log('📡 Received positions update:', data?.length || 0);
      setPositions(data || []);
    });

    // Listen to account updates
    channel.bind('account-update', (data: any) => {
      console.log('📡 Received account update');
      setAccountInfo(data);
    });

    // Listen to bot status updates
    channel.bind('bot-status', (data: any) => {
      console.log('📡 Received bot status:', data?.is_running ? 'RUNNING' : 'STOPPED');
      setBotStatus(data);
      
      // If bot just connected and we're still loading, load data
      if (loading && data.account_number) {
        const suffix = data.account_suffix || 'm';
        setAccountSuffix(suffix);
        setSelectedSymbol('BTCUSD' + suffix);
        loadOtherData();
        setLoading(false);
      }
    });

    // Listen to new trades
    channel.bind('trade-new', (data: any) => {
      console.log('📡 Received new trade:', data?.type, data?.symbol);
      // Reload trades
      fetch('/api/mt5/trades?limit=20')
        .then(res => res.json())
        .then(tradesData => {
          if (tradesData.success) setRecentTrades(tradesData.data || []);
        });
    });

    console.log('📡 Pusher subscriptions setup complete');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <Activity className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
          <p className="text-text-primary text-lg font-semibold mb-2">Waiting for EA Bot...</p>
          <p className="text-text-secondary text-sm">Please attach MT5_WebApp_Connector to a chart in MetaTrader 5</p>
          <div className="mt-6 text-text-tertiary text-xs">
            <p>The bot will automatically detect your account type</p>
            <p className="mt-1">(Dollar account with "m" suffix or Cent account with "c" suffix)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TradingLayout
        header={<TradingHeader onOpenSymbolSearch={() => setIsSymbolModalOpen(true)} />}
        chart={<TradingChart symbol={selectedSymbol} />}
        positions={<CompactPositions />}
        orderForm={<CompactOrderForm defaultSymbol={selectedSymbol} />}
        accountInfo={<CompactAccountInfo />}
        onOpenPlans={() => setIsPlansPageOpen(true)}
      />
      
      <SymbolSearchModal
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
        onSelectSymbol={(symbol) => setSelectedSymbol(symbol)}
        currentSymbol={selectedSymbol}
      />
      
      <SubscriptionPlansPage
        isOpen={isPlansPageOpen}
        onClose={() => setIsPlansPageOpen(false)}
      />
    </>
  );
}
