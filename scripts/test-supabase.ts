// Test Supabase Connection and Tables
// Run: npx tsx scripts/test-supabase.ts

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please set:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey?.substring(0, 20) + '...\n');

  const tables = [
    'trades',
    'open_positions',
    'account_history',
    'bot_status',
    'commands',
    'statistics',
    'chart_data'
  ];

  let allTablesExist = true;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table "${table}": NOT FOUND`);
        console.log(`   Error: ${error.message}\n`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table "${table}": EXISTS (${count || 0} rows)`);
      }
    } catch (err: any) {
      console.log(`❌ Table "${table}": ERROR`);
      console.log(`   ${err.message}\n`);
      allTablesExist = false;
    }
  }

  console.log('\n' + '='.repeat(60));

  if (allTablesExist) {
    console.log('✅ ALL TABLES EXIST! Database is ready.');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: pnpm dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Setup EA Bot in MetaTrader 5');
  } else {
    console.log('❌ SOME TABLES ARE MISSING!');
    console.log('\n📝 To fix:');
    console.log('   1. Go to Supabase Dashboard');
    console.log('   2. Click SQL Editor');
    console.log('   3. Copy content from: lib/supabase/schema.sql');
    console.log('   4. Paste and Run');
    console.log('   5. Run this script again');
  }

  console.log('='.repeat(60) + '\n');
}

// Test insert to verify write permissions
async function testInsert() {
  console.log('\n🔍 Testing Write Permissions...\n');

  try {
    // Test insert bot_status
    const { data, error } = await supabase
      .from('bot_status')
      .upsert({
        status: 'STOPPED',
        last_heartbeat: new Date().toISOString(),
        version: '1.0.0'
      })
      .select();

    if (error) {
      console.log('❌ Write Test FAILED');
      console.log(`   Error: ${error.message}`);
      console.log('\n📝 Check Row Level Security (RLS) policies in Supabase');
    } else {
      console.log('✅ Write Test PASSED');
      console.log('   Successfully inserted test data');
    }
  } catch (err: any) {
    console.log('❌ Write Test ERROR');
    console.log(`   ${err.message}`);
  }
}

// Run tests
(async () => {
  try {
    await testConnection();
    await testInsert();
  } catch (error: any) {
    console.error('\n❌ Connection Error:', error.message);
    console.error('\n📝 Check your .env.local file and Supabase credentials');
    process.exit(1);
  }
})();
