// Trading Types

export type OrderType = 'BUY' | 'SELL';
export type BotStatus = 'RUNNING' | 'PAUSED' | 'STOPPED';
export type CommandStatus = 'PENDING' | 'EXECUTED' | 'FAILED';
export type CommandType = 'PLACE_ORDER' | 'CLOSE_ORDER' | 'PAUSE_BOT' | 'RESUME_BOT' | 'UPDATE_PARAMS';
export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';
export type StatisticsPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface Trade {
  id: string;
  ticket: number;
  symbol: string;
  type: OrderType;
  volume: number;
  open_price: number;
  close_price?: number;
  open_time: string;
  close_time?: string;
  profit?: number;
  commission: number;
  swap: number;
  comment?: string;
  magic_number?: number;
  created_at: string;
  updated_at: string;
}

export interface OpenPosition {
  id: string;
  ticket: number;
  symbol: string;
  type: OrderType;
  volume: number;
  open_price: number;
  current_price: number;
  profit: number;
  sl?: number;
  tp?: number;
  comment?: string;
  magic_number?: number;
  open_time: string;
  created_at: string;
  updated_at: string;
}

export interface AccountInfo {
  id: string;
  timestamp: string;
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  margin_level?: number;
  profit: number;
  created_at: string;
}

export interface ChartData {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  created_at: string;
}

export interface BotStatusData {
  id: string;
  status: BotStatus;
  last_heartbeat: string;
  version?: string;
  account_number?: number;
  broker?: string;
  created_at: string;
  updated_at: string;
}

export interface Command {
  id: string;
  command_type: CommandType;
  parameters: Record<string, any>;
  status: CommandStatus;
  result?: Record<string, any>;
  created_at: string;
  executed_at?: string;
}

export interface Statistics {
  id: string;
  period: StatisticsPeriod;
  period_start: string;
  period_end: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_profit: number;
  total_loss: number;
  net_profit: number;
  max_drawdown: number;
  average_profit: number;
  profit_factor: number;
  created_at: string;
  updated_at: string;
}

// API Request/Response Types
export interface PlaceOrderRequest {
  symbol: string;
  type: OrderType;
  volume: number;
  sl?: number;
  tp?: number;
  comment?: string;
}

export interface CloseOrderRequest {
  ticket: number;
}

export interface MT5DataPayload {
  api_key: string;
  data: any;
}
