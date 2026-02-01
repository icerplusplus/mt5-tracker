import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Clear old pending commands (older than 1 hour)
export async function POST(request: NextRequest) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Update old pending commands to EXPIRED
    const { data, error } = await supabase
      .from('commands')
      .update({ status: 'EXPIRED' })
      .eq('status', 'PENDING')
      .lt('created_at', oneHourAgo)
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${data?.length || 0} old commands`,
      data 
    });
  } catch (error: any) {
    console.error('Error clearing commands:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete all pending commands (for testing)
export async function DELETE(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('commands')
      .update({ status: 'CANCELLED' })
      .eq('status', 'PENDING')
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `Cancelled ${data?.length || 0} pending commands`,
      data 
    });
  } catch (error: any) {
    console.error('Error cancelling commands:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
