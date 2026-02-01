import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// EA Bot polls this endpoint to get pending commands
export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.MT5_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending commands
    const { data, error } = await supabase
      .from('commands')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching commands:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// EA Bot reports command execution result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.MT5_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { command_id, status, result } = body;

    const { data, error } = await supabase
      .from('commands')
      .update({
        status,
        result,
        executed_at: new Date().toISOString()
      })
      .eq('id', command_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating command:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
