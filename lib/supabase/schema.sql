-- MT5 Trading Dashboard Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Trades (Lịch sử giao dịch)
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket BIGINT UNIQUE NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  type VARCHAR(10) NOT NULL, -- BUY, SELL
  volume DECIMAL(10, 2) NOT NULL,
  open_price DECIMAL(20, 5) NOT NULL,
  close_price DECIMAL(20, 5),
  open_time TIMESTAMP NOT NULL,
  close_time TIMESTAMP,
  profit DECIMAL(20, 2),
  commission DECIMAL(20, 2) DEFAULT 0,
  swap DECIMAL(20, 2) DEFAULT 0,
  comment TEXT,
  magic_number BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: Open Positions (Lệnh đang mở)
CREATE TABLE open_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket BIGINT UNIQUE NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  type VARCHAR(10) NOT NULL,
  volume DECIMAL(10, 2) NOT NULL,
  open_price DECIMAL(20, 5) NOT NULL,
  current_price DECIMAL(20, 5) NOT NULL,
  profit DECIMAL(20, 2) NOT NULL,
  sl DECIMAL(20, 5),
  tp DECIMAL(20, 5),
  comment TEXT,
  magic_number BIGINT,
  open_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: Account History (Lịch sử tài khoản)
CREATE TABLE account_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP NOT NULL,
  balance DECIMAL(20, 2) NOT NULL,
  equity DECIMAL(20, 2) NOT NULL,
  margin DECIMAL(20, 2) NOT NULL,
  free_margin DECIMAL(20, 2) NOT NULL,
  margin_level DECIMAL(10, 2),
  profit DECIMAL(20, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: Chart Data (Dữ liệu biểu đồ)
CREATE TABLE chart_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL, -- M1, M5, M15, M30, H1, H4, D1
  timestamp TIMESTAMP NOT NULL,
  open DECIMAL(20, 5) NOT NULL,
  high DECIMAL(20, 5) NOT NULL,
  low DECIMAL(20, 5) NOT NULL,
  close DECIMAL(20, 5) NOT NULL,
  volume BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(symbol, timeframe, timestamp)
);

-- Table: Bot Status (Trạng thái bot)
CREATE TABLE bot_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(20) NOT NULL, -- RUNNING, PAUSED, STOPPED
  last_heartbeat TIMESTAMP NOT NULL,
  version VARCHAR(50),
  account_number BIGINT,
  broker VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: Commands (Lệnh điều khiển)
CREATE TABLE commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  command_type VARCHAR(50) NOT NULL, -- PLACE_ORDER, CLOSE_ORDER, PAUSE_BOT, RESUME_BOT, UPDATE_PARAMS
  parameters JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, EXECUTED, FAILED
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP
);

-- Table: Statistics (Thống kê)
CREATE TABLE statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period VARCHAR(20) NOT NULL, -- DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  total_profit DECIMAL(20, 2) DEFAULT 0,
  total_loss DECIMAL(20, 2) DEFAULT 0,
  net_profit DECIMAL(20, 2) DEFAULT 0,
  max_drawdown DECIMAL(20, 2) DEFAULT 0,
  average_profit DECIMAL(20, 2) DEFAULT 0,
  profit_factor DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(period, period_start)
);

-- Indexes for performance
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_open_time ON trades(open_time DESC);
CREATE INDEX idx_trades_close_time ON trades(close_time DESC);
CREATE INDEX idx_open_positions_symbol ON open_positions(symbol);
CREATE INDEX idx_account_history_timestamp ON account_history(timestamp DESC);
CREATE INDEX idx_chart_data_symbol_timeframe ON chart_data(symbol, timeframe, timestamp DESC);
CREATE INDEX idx_commands_status ON commands(status, created_at DESC);
CREATE INDEX idx_statistics_period ON statistics(period, period_start DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for now - customize based on your auth)
CREATE POLICY "Allow all operations" ON trades FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON open_positions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON account_history FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON chart_data FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON bot_status FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON commands FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON statistics FOR ALL USING (true);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_open_positions_updated_at BEFORE UPDATE ON open_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_status_updated_at BEFORE UPDATE ON bot_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_statistics_updated_at BEFORE UPDATE ON statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial bot status
INSERT INTO bot_status (status, last_heartbeat, version)
VALUES ('STOPPED', NOW(), '1.0.0');
