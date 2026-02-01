-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium', 'vip')),
  slippage_mode TEXT NOT NULL CHECK (slippage_mode IN ('high', 'medium', 'low', 'zero')),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default free plan for existing users
INSERT INTO subscriptions (user_id, plan_type, slippage_mode, price, status)
VALUES ('default_user', 'free', 'high', 0, 'active')
ON CONFLICT (user_id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (for demo purposes)
DROP POLICY IF EXISTS "Allow public read access" ON subscriptions;
CREATE POLICY "Allow public read access" ON subscriptions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON subscriptions;
CREATE POLICY "Allow public insert access" ON subscriptions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON subscriptions;
CREATE POLICY "Allow public update access" ON subscriptions
  FOR UPDATE USING (true);

COMMENT ON TABLE subscriptions IS 'User subscription plans with slippage modes';
