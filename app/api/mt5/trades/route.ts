import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.MT5_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trades } = body;

    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Upsert trades
    const { data, error } = await supabase
      .from('trades')
      .upsert(trades.map((t: any) => ({
        ticket: t.ticket,
        symbol: t.symbol,
        type: t.type,
        volume: t.volume,
        open_price: t.open_price,
        close_price: t.close_price,
        open_time: t.open_time,
        close_time: t.close_time,
        profit: t.profit,
        commission: t.commission || 0,
        swap: t.swap || 0,
        comment: t.comment,
        magic_number: t.magic_number
      })), { onConflict: 'ticket' })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error saving trades:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('close_time', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
