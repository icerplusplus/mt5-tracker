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

    const { status, version, account_number, broker } = body;
    const account_suffix = body.account_suffix; // Optional field

    // Update or insert bot status
    const { data: existing } = await supabase
      .from('bot_status')
      .select('id')
      .limit(1)
      .single();

    let data, error;

    const updateData: any = {
      status,
      last_heartbeat: new Date().toISOString(),
      version,
      account_number,
      broker
    };

    // Only add account_suffix if column exists (optional)
    if (account_suffix) {
      updateData.account_suffix = account_suffix;
    }

    if (existing) {
      ({ data, error } = await supabase
        .from('bot_status')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('bot_status')
        .insert(updateData)
        .select()
        .single());
    }

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating bot status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('bot_status')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
