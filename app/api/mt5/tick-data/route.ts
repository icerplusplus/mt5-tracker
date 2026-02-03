import { NextRequest, NextResponse } from 'next/server';
import { broadcastTickData } from '@/lib/pusher/server';

export async function POST(request: NextRequest) {
  try {
    // Get raw text first to debug
    const text = await request.text();
    
    // Try to parse JSON
    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError: any) {
      console.error('JSON Parse Error:', parseError.message);
      return NextResponse.json({ 
        error: 'Invalid JSON', 
        details: parseError.message 
      }, { status: 400 });
    }
    
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.MT5_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symbol, timeframe, timestamp, bid, ask } = body;

    if (!symbol || !timeframe || !bid || !ask) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['symbol', 'timeframe', 'bid', 'ask']
      }, { status: 400 });
    }

    // Broadcast tick data via WebSocket for realtime candle updates
    broadcastTickData({
      symbol,
      timeframe,
      timestamp,
      bid,
      ask,
      price: (bid + ask) / 2 // Mid price
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing tick data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
