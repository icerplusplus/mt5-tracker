import { create } from 'zustand';
import { OpenPosition, AccountInfo, BotStatusData, Trade } from '@/lib/types/trading';

interface TradingState {
  // Data
  positions: OpenPosition[];
  accountInfo: AccountInfo | null;
  botStatus: BotStatusData | null;
  recentTrades: Trade[];
  
  // Subscription & Slippage
  subscription: {
    planType: 'free' | 'basic' | 'premium' | 'vip';
    slippageMode: 'zero' | 'low' | 'medium' | 'high';
    price: number;
    status: 'active' | 'expired' | 'cancelled';
    expiresAt?: string;
  } | null;
  
  // Actions
  setPositions: (positions: OpenPosition[]) => void;
  setAccountInfo: (info: AccountInfo) => void;
  setBotStatus: (status: BotStatusData) => void;
  setRecentTrades: (trades: Trade[]) => void;
  addTrade: (trade: Trade) => void;
  updatePosition: (position: OpenPosition) => void;
  removePosition: (ticket: number) => void;
  setSubscription: (subscription: any) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  positions: [],
  accountInfo: null,
  botStatus: null,
  recentTrades: [],
  subscription: null,
  
  setPositions: (positions) => set({ positions }),
  
  setAccountInfo: (info) => set({ accountInfo: info }),
  
  setBotStatus: (status) => set({ botStatus: status }),
  
  setRecentTrades: (trades) => set({ recentTrades: trades }),
  
  addTrade: (trade) => set((state) => ({
    recentTrades: [trade, ...state.recentTrades].slice(0, 50)
  })),
  
  updatePosition: (position) => set((state) => ({
    positions: state.positions.map(p => 
      p.ticket === position.ticket ? position : p
    )
  })),
  
  removePosition: (ticket) => set((state) => ({
    positions: state.positions.filter(p => p.ticket !== ticket)
  })),
  
  setSubscription: (subscription) => set({ subscription }),
}));
