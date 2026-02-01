import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET current subscription
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'default_user';

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // If no subscription, return free plan
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          plan_type: 'free',
          slippage_mode: 'high',
          price: 0,
          status: 'active'
        }
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create/update subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planType, slippageMode, price } = body;

    if (!userId || !planType || !slippageMode) {
      return NextResponse.json({
        error: 'Missing required fields: userId, planType, slippageMode'
      }, { status: 400 });
    }

    // Calculate expiry date (30 days from now for paid plans)
    const expiresAt = planType !== 'free' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Upsert subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan_type: planType,
        slippage_mode: slippageMode,
        price: price || 0,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
