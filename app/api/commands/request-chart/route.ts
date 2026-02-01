import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, timeframe } = body;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Insert command into database
    const { data, error } = await supabase
      .from('commands')
      .insert({
        command_type: 'REQUEST_CHART_DATA',
        parameters: { symbol, timeframe: timeframe || 'H1' },
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting command:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in request-chart API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
