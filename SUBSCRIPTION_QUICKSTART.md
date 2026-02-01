# Subscription Plans - Quick Start

## ✅ Hoàn Thành

Đã chuyển từ hệ thống balance-based sang **subscription-based** slippage modes.

## Thay Đổi Chính

### Trước (Balance-Based)
- Dựa vào số dư tài khoản MT5
- $0 → High slippage
- $100 → Medium slippage
- $500 → Low slippage
- $1000 → Zero slippage

### Sau (Subscription-Based) ✅
- Dựa vào gói đăng ký (subscription plan)
- **FREE** → High slippage (5-10 pips)
- **BASIC** ($100/month) → Medium slippage (3-5 pips)
- **PREMIUM** ($500/month) → Low slippage (1-2 pips)
- **VIP** ($1000/month) → Zero slippage (0 pips)

## Subscription Plans

| Plan | Icon | Slippage | Price | Features |
|------|------|----------|-------|----------|
| VIP | ⚡ | 0 pips | $1,000/mo | Zero slippage, Priority support, API |
| Premium | 🔹 | 1-2 pips | $500/mo | Low slippage, Email support, Analytics |
| Basic | 🔸 | 3-5 pips | $100/mo | Medium slippage, Community support |
| Free | 🔴 | 5-10 pips | Free | High slippage, Basic features |

## Setup

### 1. Run Database Migration

```sql
-- In Supabase SQL Editor:
-- Copy and run: lib/supabase/migrations/add_subscriptions.sql
```

### 2. Restart Web App

```bash
pnpm dev
```

### 3. Test

1. Open web app
2. Scroll to "Subscription Plans"
3. Click on a plan (e.g., PREMIUM)
4. Modal opens → Click "Subscribe Now"
5. Subscription created ✅
6. Slippage mode applied to chart ✅

## User Flow

### Đăng Ký Plan Mới

```
1. User clicks plan card (e.g., PREMIUM)
2. Upgrade modal opens
3. Shows: Price, Features, Slippage
4. User clicks "Subscribe Now"
5. API creates subscription
6. Chart applies new slippage mode
7. Success message shown
```

### Downgrade về Free

```
1. User clicks FREE card
2. No modal (instant)
3. Subscription updated to FREE
4. Chart applies HIGH slippage
```

## Files Changed

### New Files
- ✅ `app/components/SubscriptionPlans.tsx` - UI component
- ✅ `app/api/subscriptions/route.ts` - API endpoints
- ✅ `lib/supabase/migrations/add_subscriptions.sql` - Database schema

### Modified Files
- ✅ `lib/store/trading-store.ts` - Added subscription state
- ✅ `app/components/TradingChart.tsx` - Use subscription slippage mode
- ✅ `app/page.tsx` - Use SubscriptionPlans component

### Removed Files
- ❌ `app/components/SlippageSelector.tsx` - Replaced by SubscriptionPlans

## API Endpoints

### GET /api/subscriptions?userId=xxx
Lấy subscription hiện tại

### POST /api/subscriptions
Tạo/update subscription

```json
{
  "userId": "default_user",
  "planType": "premium",
  "slippageMode": "low",
  "price": 500
}
```

## Database

### Table: subscriptions

```sql
subscriptions (
  id UUID PRIMARY KEY,
  user_id TEXT UNIQUE,
  plan_type TEXT, -- 'free', 'basic', 'premium', 'vip'
  slippage_mode TEXT, -- 'high', 'medium', 'low', 'zero'
  price DECIMAL,
  status TEXT, -- 'active', 'expired', 'cancelled'
  started_at TIMESTAMP,
  expires_at TIMESTAMP
)
```

## Testing

### Test 1: Default Free Plan
```
✅ New user → FREE plan
✅ High slippage (5-10 pips)
```

### Test 2: Upgrade to Premium
```
✅ Click PREMIUM → Modal opens
✅ Subscribe → Subscription created
✅ Low slippage (1-2 pips) applied
```

### Test 3: Upgrade to VIP
```
✅ Click VIP → Modal opens
✅ Subscribe → Subscription created
✅ Zero slippage (0 pips) applied
```

## Troubleshooting

### Subscription không load
1. Check database migration đã chạy
2. Check API: `/api/subscriptions?userId=default_user`
3. Check console log

### Slippage không apply
1. Check subscription trong store
2. Check TradingChart đang dùng subscription
3. Refresh browser

### Modal không hiện
1. Hard refresh: Ctrl+Shift+R
2. Clear cache
3. Restart dev server

## Next Steps

### Phase 2: Payment Integration
- [ ] Stripe integration
- [ ] PayPal integration
- [ ] Invoice generation

### Phase 3: Subscription Management
- [ ] Auto-renewal
- [ ] Expiry notifications
- [ ] Refund handling

---

**Status**: ✅ Ready to Use
**Version**: 2.0.0
