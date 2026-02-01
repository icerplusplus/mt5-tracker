import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfQuarter, endOfYear } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'DAILY';

    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'DAILY':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'WEEKLY':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'MONTHLY':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'QUARTERLY':
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      case 'YEARLY':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }

    // Get trades in period
    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .gte('close_time', startDate.toISOString())
      .lte('close_time', endDate.toISOString())
      .not('close_time', 'is', null);

    if (error) throw error;

    // Calculate statistics
    const totalTrades = trades?.length || 0;
    const winningTrades = trades?.filter(t => (t.profit || 0) > 0).length || 0;
    const losingTrades = trades?.filter(t => (t.profit || 0) < 0).length || 0;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const totalProfit = trades?.filter(t => (t.profit || 0) > 0).reduce((sum, t) => sum + (t.profit || 0), 0) || 0;
    const totalLoss = Math.abs(trades?.filter(t => (t.profit || 0) < 0).reduce((sum, t) => sum + (t.profit || 0), 0) || 0);
    const netProfit = totalProfit - totalLoss;
    const averageProfit = totalTrades > 0 ? netProfit / totalTrades : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

    // Calculate max drawdown (simplified)
    let maxDrawdown = 0;
    let peak = 0;
    let runningProfit = 0;
    
    trades?.sort((a, b) => new Date(a.close_time!).getTime() - new Date(b.close_time!).getTime())
      .forEach(trade => {
        runningProfit += trade.profit || 0;
        if (runningProfit > peak) peak = runningProfit;
        const drawdown = peak - runningProfit;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });

    const statistics = {
      period,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
      total_trades: totalTrades,
      winning_trades: winningTrades,
      losing_trades: losingTrades,
      win_rate: parseFloat(winRate.toFixed(2)),
      total_profit: parseFloat(totalProfit.toFixed(2)),
      total_loss: parseFloat(totalLoss.toFixed(2)),
      net_profit: parseFloat(netProfit.toFixed(2)),
      max_drawdown: parseFloat(maxDrawdown.toFixed(2)),
      average_profit: parseFloat(averageProfit.toFixed(2)),
      profit_factor: parseFloat(profitFactor.toFixed(2))
    };

    return NextResponse.json({ success: true, data: statistics });
  } catch (error: any) {
    console.error('Error calculating statistics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
