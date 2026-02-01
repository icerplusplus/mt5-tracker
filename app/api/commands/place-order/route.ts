import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, type, volume, sl, tp, comment } = body;

    console.log('📥 Received order request:', { symbol, type, volume, sl, tp, comment });

    // Validate input
    if (!symbol || !type || !volume) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, type, volume' },
        { status: 400 }
      );
    }

    // Create command - preserve symbol case
    const { data, error } = await supabase
      .from('commands')
      .insert({
        command_type: 'PLACE_ORDER',
        parameters: {
          symbol: symbol, // Keep original case
          type,
          volume,
          sl,
          tp,
          comment
        },
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Command created:', data);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating place order command:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
