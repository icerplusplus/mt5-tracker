import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { broadcastAccountInfo } from '@/lib/pusher/server';

export async function POST(request: NextRequest) {
  try {
    // Get raw text first to debug
    const text = await request.text();
    console.log('Raw body received:', text);
    console.log('Body length:', text.length);
    console.log('First 200 chars:', text.substring(0, 200));
    
    // Try to parse JSON
    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError: any) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Invalid JSON at position:', parseError.message.match(/\d+/)?.[0]);
      return NextResponse.json({ 
        error: 'Invalid JSON', 
        details: parseError.message,
        received: text.substring(0, 200)
      }, { status: 400 });
    }
    
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.MT5_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { balance, equity, margin, free_margin, margin_level, profit } = body;

    // Insert account info
    const { data, error } = await supabase
      .from('account_history')
      .insert({
        timestamp: new Date().toISOString(),
        balance,
        equity,
        margin,
        free_margin,
        margin_level,
        profit: profit || 0
      })
      .select()
      .single();

    if (error) throw error;

    // Broadcast to WebSocket clients
    broadcastAccountInfo(data);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error saving account info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('account_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
