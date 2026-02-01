import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body; // 'PAUSE' or 'RESUME'

    if (!action || !['PAUSE', 'RESUME'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be PAUSE or RESUME' },
        { status: 400 }
      );
    }

    const commandType = action === 'PAUSE' ? 'PAUSE_BOT' : 'RESUME_BOT';

    // Create command
    const { data, error } = await supabase
      .from('commands')
      .insert({
        command_type: commandType,
        parameters: {},
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating bot control command:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
