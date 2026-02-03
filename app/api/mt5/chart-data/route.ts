import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { broadcastChartData } from '@/lib/pusher/server';

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

    const { bars } = body;

    if (!bars || bars.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Upsert chart data
    const { data, error } = await supabase
      .from('chart_data')
      .upsert(bars.map((bar: any) => ({
        symbol: bar.symbol,
        timeframe: bar.timeframe,
        timestamp: bar.timestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume || 0
      })), { 
        onConflict: 'symbol,timeframe,timestamp',
        ignoreDuplicates: false 
      })
      .select();

    if (error) throw error;

    // Broadcast latest bar via WebSocket for realtime updates
    if (bars.length > 0) {
      const latestBar = bars[bars.length - 1];
      broadcastChartData(latestBar);
      console.log('📊 Broadcasted chart update:', latestBar.symbol, latestBar.timeframe);
    }

    return NextResponse.json({ success: true, data, count: bars.length });
  } catch (error: any) {
    console.error('Error saving chart data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'EURUSD';
    const timeframe = searchParams.get('timeframe') || 'M5';
    const limit = parseInt(searchParams.get('limit') || '100');

    const { data, error } = await supabase
      .from('chart_data')
      .select('*')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
