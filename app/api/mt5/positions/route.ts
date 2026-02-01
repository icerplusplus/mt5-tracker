import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { broadcastPositions } from '@/lib/websocket/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.MT5_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { positions } = body;
    
    console.log('📊 Received positions update:', positions?.length || 0, 'positions');

    // Delete all existing positions
    const { error: deleteError } = await supabase
      .from('open_positions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('Error deleting old positions:', deleteError);
    }

    let savedPositions = [];

    // Insert new positions
    if (positions && positions.length > 0) {
      const { data, error } = await supabase
        .from('open_positions')
        .insert(positions.map((p: any) => ({
          ticket: p.ticket,
          symbol: p.symbol,
          type: p.type,
          volume: p.volume,
          open_price: p.open_price,
          current_price: p.current_price,
          profit: p.profit,
          sl: p.sl,
          tp: p.tp,
          comment: p.comment,
          magic_number: p.magic_number,
          open_time: p.open_time
        })))
        .select();

      if (error) {
        console.error('Error inserting positions:', error);
        throw error;
      }

      savedPositions = data || [];
      console.log('✅ Saved', savedPositions.length, 'positions to database');
    } else {
      console.log('✅ No positions to save (cleared all)');
    }

    // Broadcast to all WebSocket clients
    broadcastPositions(savedPositions);

    return NextResponse.json({ success: true, data: savedPositions });
  } catch (error: any) {
    console.error('Error saving positions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('open_positions')
      .select('*')
      .order('open_time', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
