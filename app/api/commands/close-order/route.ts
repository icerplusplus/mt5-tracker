import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticket } = body;

    if (!ticket) {
      return NextResponse.json(
        { error: 'Missing required field: ticket' },
        { status: 400 }
      );
    }

    // Create command
    const { data, error } = await supabase
      .from('commands')
      .insert({
        command_type: 'CLOSE_ORDER',
        parameters: { ticket },
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating close order command:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
