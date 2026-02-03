/**
 * Test script to send fake tick data to the API
 * This simulates EA Bot sending tick updates
 * 
 * Usage:
 *   pnpm tsx scripts/test-tick-updates.ts
 */

const API_URL = 'http://localhost:3000/api/mt5/tick-data';
const API_KEY = 'your_secure_random_api_key_min_32_chars';

async function sendTick(symbol: string, timeframe: string, price: number) {
  const tick = {
    symbol,
    timeframe,
    timestamp: new Date().toISOString(),
    bid: price - 0.00005,
    ask: price + 0.00005,
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(tick),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Tick sent: ${symbol} @ ${price.toFixed(5)}`);
    } else {
      console.error('❌ Failed:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function simulateRealtime() {
  const symbol = 'BTCUSD';
  const timeframe = 'H1';
  let basePrice = 1.10000;
  
  console.log('🚀 Starting tick simulation...');
  console.log(`📊 Symbol: ${symbol} | Timeframe: ${timeframe}`);
  console.log('💡 Open http://localhost:3000 and watch the chart update!\n');

  // Send ticks every second with random price movement
  setInterval(() => {
    // Random price movement: +/- 0.00010 (1 pip)
    const movement = (Math.random() - 0.5) * 0.00020;
    basePrice += movement;
    
    sendTick(symbol, timeframe, basePrice);
  }, 1000);
}

// Start simulation
simulateRealtime();
