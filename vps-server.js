const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// CORS - Allow Vercel domain
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',  // Thay bằng domain Vercel của bạn
    /\.vercel\.app$/  // Allow all vercel preview deployments
  ],
  credentials: true
}));

app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Service role key for server-side
);

// API Key authentication
const API_KEY = process.env.MT5_API_KEY || 'your_secure_api_key_here';

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// MT5 EA Bot Endpoints (từ EA Bot gọi vào)
// ============================================

// Account Info
app.post('/api/mt5/account-info', authenticateApiKey, async (req, res) => {
  try {
    const accountData = {
      ...req.body,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('account_history')
      .insert(accountData);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving account info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Open Positions
app.post('/api/mt5/positions', authenticateApiKey, async (req, res) => {
  try {
    const { positions } = req.body;

    // Delete old positions
    await supabase.from('open_positions').delete().neq('ticket', 0);

    // Insert new positions
    if (positions && positions.length > 0) {
      const { error } = await supabase
        .from('open_positions')
        .insert(positions);

      if (error) throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving positions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bot Status
app.post('/api/mt5/bot-status', authenticateApiKey, async (req, res) => {
  try {
    const { error } = await supabase
      .from('bot_status')
      .upsert(req.body, { onConflict: 'account_number' });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving bot status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tick Data
app.post('/api/mt5/tick-data', authenticateApiKey, async (req, res) => {
  try {
    // Broadcast via WebSocket if needed, or just return success
    // Tick data is high frequency, consider not saving to DB
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing tick data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chart Data
app.post('/api/mt5/chart-data', authenticateApiKey, async (req, res) => {
  try {
    const { bars } = req.body;

    if (bars && bars.length > 0) {
      // Delete old chart data for this symbol/timeframe
      const { symbol, timeframe } = bars[0];
      await supabase
        .from('chart_data')
        .delete()
        .eq('symbol', symbol)
        .eq('timeframe', timeframe);

      // Insert new bars
      const { error } = await supabase
        .from('chart_data')
        .insert(bars);

      if (error) throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving chart data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trades
app.post('/api/mt5/trades', authenticateApiKey, async (req, res) => {
  try {
    const { trades } = req.body;

    if (trades && trades.length > 0) {
      const { error } = await supabase
        .from('trades')
        .insert(trades);

      if (error) throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving trades:', error);
    res.status(500).json({ error: error.message });
  }
});

// Commands - EA Bot checks for pending commands
app.get('/api/mt5/commands', authenticateApiKey, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commands')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({ error: error.message });
  }
});

// Commands - EA Bot reports execution result
app.post('/api/mt5/commands', authenticateApiKey, async (req, res) => {
  try {
    const { command_id, status, result } = req.body;

    const { error } = await supabase
      .from('commands')
      .update({
        status,
        result,
        executed_at: new Date().toISOString()
      })
      .eq('id', command_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating command:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Vercel Web App Endpoints (từ Vercel gọi vào)
// ============================================

// Get Account Info (latest)
app.get('/api/mt5/account-info', authenticateApiKey, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('account_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ success: true, data: data || null });
  } catch (error) {
    console.error('Error fetching account info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Open Positions
app.get('/api/mt5/positions', authenticateApiKey, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('open_positions')
      .select('*')
      .order('open_time', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Bot Status
app.get('/api/mt5/bot-status', authenticateApiKey, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bot_status')
      .select('*')
      .order('last_update', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ success: true, data: data || null });
  } catch (error) {
    console.error('Error fetching bot status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Chart Data
app.get('/api/mt5/chart-data', authenticateApiKey, async (req, res) => {
  try {
    const { symbol, timeframe, limit = 200 } = req.query;

    const { data, error } = await supabase
      .from('chart_data')
      .select('*')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .order('timestamp', { ascending: true })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Trades
app.get('/api/mt5/trades', authenticateApiKey, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('close_time', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Command Endpoints (Vercel tạo commands)
// ============================================

// Place Order
app.post('/api/commands/place-order', authenticateApiKey, async (req, res) => {
  try {
    const { symbol, type, volume, sl, tp, comment } = req.body;

    const { data, error } = await supabase
      .from('commands')
      .insert({
        command_type: 'PLACE_ORDER',
        parameters: { symbol, type, volume, sl, tp, comment },
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating place order command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Close Order
app.post('/api/commands/close-order', authenticateApiKey, async (req, res) => {
  try {
    const { ticket } = req.body;

    const { data, error } = await supabase
      .from('commands')
      .insert({
        command_type: 'CLOSE_ORDER',
        parameters: { ticket },
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating close order command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bot Control
app.post('/api/commands/bot-control', authenticateApiKey, async (req, res) => {
  try {
    const { action } = req.body;

    const { data, error } = await supabase
      .from('commands')
      .insert({
        command_type: action === 'pause' ? 'PAUSE_BOT' : 'RESUME_BOT',
        parameters: {},
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating bot control command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Request Chart Data
app.post('/api/commands/request-chart', authenticateApiKey, async (req, res) => {
  try {
    const { symbol, timeframe } = req.body;

    const { data, error } = await supabase
      .from('commands')
      .insert({
        command_type: 'REQUEST_CHART_DATA',
        parameters: { symbol, timeframe },
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating request chart command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear Commands
app.post('/api/commands/clear', authenticateApiKey, async (req, res) => {
  try {
    const { error } = await supabase
      .from('commands')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing commands:', error);
    res.status(500).json({ error: error.message });
  }
});

// Statistics
app.get('/api/statistics', authenticateApiKey, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('statistics')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Subscriptions
app.get('/api/subscriptions', authenticateApiKey, async (req, res) => {
  try {
    const { userId = 'default_user' } = req.query;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return res.json({
        success: true,
        data: {
          plan_type: 'free',
          slippage_mode: 'high',
          price: 0,
          status: 'active'
        }
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscriptions', authenticateApiKey, async (req, res) => {
  try {
    const { userId, planType, slippageMode, price } = req.body;

    const expiresAt = planType !== 'free'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_type: planType,
        slippage_mode: slippageMode,
        price: price || 0,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ VPS API Server running on port ${PORT}`);
  console.log(`📡 Listening for EA Bot on http://localhost:${PORT}`);
  console.log(`🌐 Accessible from Vercel via public IP`);
});
