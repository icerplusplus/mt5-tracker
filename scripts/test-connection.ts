// Test EA Bot <-> Web App Connection
// Run: npx tsx scripts/test-connection.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing EA Bot <-> Web App Connection\n');
  console.log('='.repeat(60));

  // Test 1: Check bot_status table
  console.log('\n📊 Test 1: Checking Bot Status...');
  try {
    const { data, error } = await supabase
      .from('bot_status')
      .select('*')
      .order('last_heartbeat', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.log('❌ No bot status found');
      console.log('   EA Bot has not connected yet');
    } else if (data) {
      const lastHeartbeat = new Date(data.last_heartbeat);
      const now = new Date();
      const secondsAgo = Math.floor((now.getTime() - lastHeartbeat.getTime()) / 1000);

      console.log('✅ Bot Status Found:');
      console.log(`   Status: ${data.status}`);
      console.log(`   Last Heartbeat: ${secondsAgo}s ago`);
      console.log(`   Version: ${data.version || 'N/A'}`);
      console.log(`   Account: ${data.account_number || 'N/A'}`);

      if (secondsAgo < 10) {
        console.log('   🟢 CONNECTED (Active)');
      } else if (secondsAgo < 60) {
        console.log('   🟡 CONNECTED (Recent)');
      } else {
        console.log('   🔴 DISCONNECTED (Stale)');
      }
    }
  } catch (err: any) {
    console.log('❌ Error:', err.message);
  }

  // Test 2: Check account_history
  console.log('\n📊 Test 2: Checking Account Data...');
  try {
    const { data, error, count } = await supabase
      .from('account_history')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      console.log('❌ No account data found');
      console.log('   EA Bot has not sent account info yet');
    } else {
      const latest = data[0];
      const timestamp = new Date(latest.timestamp);
      const secondsAgo = Math.floor((Date.now() - timestamp.getTime()) / 1000);

      console.log('✅ Account Data Found:');
      console.log(`   Balance: $${latest.balance}`);
      console.log(`   Equity: $${latest.equity}`);
      console.log(`   Last Update: ${secondsAgo}s ago`);
      console.log(`   Total Records: ${count}`);
    }
  } catch (err: any) {
    console.log('❌ Error:', err.message);
  }

  // Test 3: Check open_positions
  console.log('\n📊 Test 3: Checking Open Positions...');
  try {
    const { data, error, count } = await supabase
      .from('open_positions')
      .select('*', { count: 'exact' });

    if (error) {
      console.log('❌ Error checking positions');
    } else {
      console.log(`✅ Open Positions: ${count || 0}`);
      if (data && data.length > 0) {
        data.forEach((pos: any) => {
          console.log(`   - ${pos.symbol} ${pos.type} ${pos.volume} lots (Profit: $${pos.profit})`);
        });
      }
    }
  } catch (err: any) {
    console.log('❌ Error:', err.message);
  }

  // Test 4: Check trades
  console.log('\n📊 Test 4: Checking Trade History...');
  try {
    const { data, error, count } = await supabase
      .from('trades')
      .select('*', { count: 'exact' })
      .order('close_time', { ascending: false, nullsFirst: false })
      .limit(5);

    if (error) {
      console.log('❌ Error checking trades');
    } else {
      console.log(`✅ Total Trades: ${count || 0}`);
      if (data && data.length > 0) {
        console.log('   Recent trades:');
        data.forEach((trade: any) => {
          console.log(`   - ${trade.symbol} ${trade.type} (Profit: $${trade.profit || 0})`);
        });
      }
    }
  } catch (err: any) {
    console.log('❌ Error:', err.message);
  }

  // Test 5: Check commands
  console.log('\n📊 Test 5: Checking Commands...');
  try {
    const { data, error, count } = await supabase
      .from('commands')
      .select('*', { count: 'exact' })
      .eq('status', 'PENDING');

    if (error) {
      console.log('❌ Error checking commands');
    } else {
      console.log(`✅ Pending Commands: ${count || 0}`);
      if (data && data.length > 0) {
        data.forEach((cmd: any) => {
          console.log(`   - ${cmd.command_type} (Created: ${new Date(cmd.created_at).toLocaleString()})`);
        });
      }
    }
  } catch (err: any) {
    console.log('❌ Error:', err.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Summary:\n');
  console.log('If you see:');
  console.log('  ✅ Bot Status with recent heartbeat → EA Bot is connected');
  console.log('  ✅ Account Data → EA Bot is sending data');
  console.log('  ❌ No data → EA Bot not connected yet\n');
  console.log('To connect EA Bot:');
  console.log('  1. Open MetaTrader 5');
  console.log('  2. Attach MT5_WebApp_Connector EA to any chart');
  console.log('  3. Check MT5 Experts tab for logs');
  console.log('  4. Wait 5-10 seconds');
  console.log('  5. Run this script again\n');
  console.log('='.repeat(60) + '\n');
}

testConnection();
