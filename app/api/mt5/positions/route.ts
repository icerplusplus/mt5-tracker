import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { broadcastPositions } from '@/lib/pusher/server';

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

    let savedPositions = [];

    if (positions && positions.length > 0) {
      // Use upsert to handle duplicates gracefully
      // This will update existing positions or insert new ones
      const { data, error } = await supabase
        .from('open_positions')
        .upsert(
          positions.map((p: any) => ({
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
          })),
          { onConflict: 'ticket' } // Use ticket as unique key
        )
        .select();

      if (error) {
        console.error('Error upserting positions:', error);
        throw error;
      }

      savedPositions = data || [];
      
      // Delete positions that are no longer in the list
      const currentTickets = positions.map((p: any) => p.ticket);
      const { error: deleteError } = await supabase
        .from('open_positions')
        .delete()
        .not('ticket', 'in', `(${currentTickets.join(',')})`);
      
      if (deleteError) {
        console.error('Error deleting closed positions:', deleteError);
      }
      
      console.log('✅ Upserted', savedPositions.length, 'positions to database');
    } else {
      // No positions - delete all
      const { error: deleteError } = await supabase
        .from('open_positions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('Error deleting all positions:', deleteError);
      }
      
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
