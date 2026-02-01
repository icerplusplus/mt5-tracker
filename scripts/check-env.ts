// Check Environment Variables
// Run: npx tsx scripts/check-env.ts

console.log('🔍 Checking Environment Variables...\n');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'MT5_API_KEY'
];

let allPresent = true;

for (const varName of requiredVars) {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    allPresent = false;
  } else if (value.includes('your_') || value.includes('xxx')) {
    console.log(`⚠️  ${varName}: SET but looks like placeholder`);
    console.log(`   Value: ${value.substring(0, 30)}...`);
    allPresent = false;
  } else {
    console.log(`✅ ${varName}: SET`);
    console.log(`   Value: ${value.substring(0, 30)}...`);
  }
}

console.log('\n' + '='.repeat(60));

if (allPresent) {
  console.log('✅ All environment variables are set!');
  console.log('\n📝 Next: Run test-supabase.ts to check database');
  console.log('   npx tsx scripts/test-supabase.ts');
} else {
  console.log('❌ Some environment variables are missing or invalid!');
  console.log('\n📝 To fix:');
  console.log('   1. Copy .env.local.example to .env.local');
  console.log('   2. Edit .env.local with your Supabase credentials');
  console.log('   3. Get credentials from: https://supabase.com/dashboard');
  console.log('   4. Run this script again');
}

console.log('='.repeat(60) + '\n');
