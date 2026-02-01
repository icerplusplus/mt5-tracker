# Subscription Plans System - Complete Implementation

## Tổng Quan

Hệ thống subscription plans cho phép user đăng ký các gói khác nhau để unlock slippage modes. Thay vì dựa vào balance, giờ user phải **đăng ký tài khoản** (subscription) để có slippage mode tương ứng.

## Subscription Plans

| Plan | Slippage Mode | Slippage | Price | Features |
|------|---------------|----------|-------|----------|
| **VIP** ⚡ | Zero | 0 pips | $1,000/month | Zero slippage, Priority support, Advanced analytics, API access |
| **Premium** 🔹 | Low | 1-2 pips | $500/month | Low slippage, Email support, Basic analytics, Mobile app |
| **Basic** 🔸 | Medium | 3-5 pips | $100/month | Medium slippage, Community support, Standard features |
| **Free** 🔴 | High | 5-10 pips | $0 (Free) | High slippage, Basic features, Community access |

## Architecture

### 1. Database Schema

**File**: `lib/supabase/migrations/add_subscriptions.sql`

**Table**: `subscriptions`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL, -- 'free', 'basic', 'premium', 'vip'
  slippage_mode TEXT NOT NULL, -- 'high', 'medium', 'low', 'zero'
  price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL, -- 'active', 'expired', 'cancelled'
  started_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Features**:
- ✅ Unique user_id (one subscription per user)
- ✅ Auto-update updated_at timestamp
- ✅ Row Level Security enabled
- ✅ Indexes for fast lookups
- ✅ Default free plan for new users

### 2. API Endpoints

**File**: `app/api/subscriptions/route.ts`

#### GET /api/subscriptions?userId=xxx

**Purpose**: Lấy subscription hiện tại của user

**Response**:
```json
{
  "success": true,
  "data": {
    "plan_type": "premium",
    "slippage_mode": "low",
    "price": 500,
    "status": "active",
    "expires_at": "2026-03-01T00:00:00Z"
  }
}
```

#### POST /api/subscriptions

**Purpose**: Tạo hoặc update subscription

**Request**:
```json
{
  "userId": "default_user",
  "planType": "premium",
  "slippageMode": "low",
  "price": 500
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "default_user",
    "plan_type": "premium",
    "slippage_mode": "low",
    "price": 500,
    "status": "active",
    "started_at": "2026-02-01T00:00:00Z",
    "expires_at": "2026-03-01T00:00:00Z"
  }
}
```

### 3. State Management

**File**: `lib/store/trading-store.ts`

**New State**:
```typescript
interface TradingState {
  subscription: {
    planType: 'free' | 'basic' | 'premium' | 'vip';
    slippageMode: 'zero' | 'low' | 'medium' | 'high';
    price: number;
    status: 'active' | 'expired' | 'cancelled';
    expiresAt?: string;
  } | null;
  
  setSubscription: (subscription: any) => void;
}
```

**Usage**:
```typescript
const { subscription, setSubscription } = useTradingStore();
const slippageMode = subscription?.slippageMode || 'high';
```

### 4. UI Component

**File**: `app/components/SubscriptionPlans.tsx`

**Features**:
- ✅ 4 plan cards in horizontal layout
- ✅ Active plan indicator
- ✅ Upgrade modal with plan details
- ✅ Subscribe button (creates subscription)
- ✅ Loading states
- ✅ Error handling
- ✅ Auto-load current subscription on mount

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Subscription Plans                    Current: VIP  │
├─────────────────────────────────────────────────────┤
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
│ │  ⚡  │  │  🔹  │  │  🔸  │  │  🔴  │            │
│ │ Zero │  │ Low  │  │Medium│  │ High │            │
│ │Slipp.│  │Slipp.│  │Slipp.│  │Slipp.│            │
│ │      │  │      │  │      │  │      │            │
│ │  0   │  │ 1-2  │  │ 3-5  │  │ 5-10 │            │
│ │ pips │  │ pips │  │ pips │  │ pips │            │
│ │      │  │      │  │      │  │      │            │
│ │$1000 │  │ $500 │  │ $100 │  │ Free │            │
│ │/month│  │/month│  │/month│  │      │            │
│ └──────┘  └──────┘  └──────┘  └──────┘            │
└─────────────────────────────────────────────────────┘
```

## User Flow

### 1. First Time User

```
1. User opens app
2. Load subscription → Returns null
3. Default to FREE plan (high slippage)
4. User sees 4 plan cards
5. Current plan: FREE (highlighted)
```

### 2. Upgrade to Paid Plan

```
1. User clicks on PREMIUM card
2. Upgrade modal opens
3. Shows:
   - Plan details
   - Price: $500/month
   - Features list
   - Slippage: 1-2 pips
4. User clicks "Subscribe Now"
5. POST /api/subscriptions
6. Subscription created in database
7. Store updated with new subscription
8. Chart applies LOW slippage mode
9. Success message shown
```

### 3. Downgrade to Free

```
1. User clicks on FREE card
2. No modal (free plan)
3. POST /api/subscriptions with free plan
4. Subscription updated
5. Chart applies HIGH slippage mode
```

## Integration with Chart

**File**: `app/components/TradingChart.tsx`

```typescript
const { subscription } = useTradingStore();
const slippageMode = subscription?.slippageMode || 'high';

// Apply slippage when updating current price line
const slippedPrice = applySlippage(price, slippageMode);
```

**Slippage Application**:
- Zero mode: 0 pips slippage
- Low mode: 1-2 pips random slippage
- Medium mode: 3-5 pips random slippage
- High mode: 5-10 pips random slippage

## Setup Instructions

### 1. Run Database Migration

```sql
-- In Supabase SQL Editor, run:
-- lib/supabase/migrations/add_subscriptions.sql
```

### 2. Restart Web App

```bash
# Stop current server (Ctrl+C)
pnpm dev
```

### 3. Test Subscription Flow

1. Open web app
2. Scroll to "Subscription Plans"
3. Click on different plans
4. Verify upgrade modal
5. Click "Subscribe Now"
6. Verify subscription created
7. Verify slippage mode applied to chart

## Testing Scenarios

### Test 1: Default Free Plan

```
✅ New user → FREE plan active
✅ Slippage mode: HIGH (5-10 pips)
✅ Current price line has high slippage
```

### Test 2: Upgrade to Premium

```
✅ Click PREMIUM card
✅ Modal opens with $500/month
✅ Click Subscribe Now
✅ Subscription created
✅ PREMIUM card now active
✅ Slippage mode: LOW (1-2 pips)
✅ Current price line has low slippage
```

### Test 3: Upgrade to VIP

```
✅ Click VIP card
✅ Modal opens with $1000/month
✅ Click Subscribe Now
✅ Subscription created
✅ VIP card now active
✅ Slippage mode: ZERO (0 pips)
✅ Current price line has NO slippage
```

### Test 4: Downgrade to Free

```
✅ Click FREE card
✅ No modal (instant)
✅ Subscription updated
✅ FREE card now active
✅ Slippage mode: HIGH (5-10 pips)
```

## API Testing

### Get Current Subscription

```bash
curl http://localhost:3000/api/subscriptions?userId=default_user
```

### Create Subscription

```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "default_user",
    "planType": "premium",
    "slippageMode": "low",
    "price": 500
  }'
```

## Database Queries

### Check Current Subscription

```sql
SELECT * FROM subscriptions 
WHERE user_id = 'default_user' 
AND status = 'active';
```

### View All Subscriptions

```sql
SELECT 
  user_id,
  plan_type,
  slippage_mode,
  price,
  status,
  expires_at
FROM subscriptions
ORDER BY created_at DESC;
```

### Update Subscription

```sql
UPDATE subscriptions
SET plan_type = 'vip',
    slippage_mode = 'zero',
    price = 1000
WHERE user_id = 'default_user';
```

## Future Enhancements

### Phase 2: Payment Integration

- [ ] Stripe payment gateway
- [ ] PayPal integration
- [ ] Cryptocurrency payments
- [ ] Invoice generation
- [ ] Payment history

### Phase 3: Subscription Management

- [ ] Auto-renewal
- [ ] Expiry notifications
- [ ] Grace period
- [ ] Refund handling
- [ ] Upgrade/downgrade prorating

### Phase 4: Advanced Features

- [ ] Trial periods (7 days free)
- [ ] Discount codes
- [ ] Referral program
- [ ] Annual billing (save 20%)
- [ ] Team/enterprise plans

### Phase 5: Analytics

- [ ] Subscription metrics dashboard
- [ ] Churn rate tracking
- [ ] Revenue analytics
- [ ] User lifetime value
- [ ] Conversion funnel

## Security Considerations

### Current Implementation

- ✅ Row Level Security enabled
- ✅ Public access for demo (should be restricted in production)
- ✅ User ID validation
- ✅ Plan type validation
- ✅ Status validation

### Production Requirements

- [ ] User authentication (JWT/OAuth)
- [ ] API key authentication
- [ ] Rate limiting
- [ ] Payment verification
- [ ] Webhook signature verification
- [ ] Audit logging

## Troubleshooting

### Subscription Not Loading

1. Check database migration ran successfully
2. Check API endpoint: `/api/subscriptions?userId=default_user`
3. Check browser console for errors
4. Verify Supabase connection

### Slippage Not Applying

1. Check subscription loaded in store
2. Check slippageMode value
3. Check TradingChart using subscription
4. Verify applySlippage() function

### Upgrade Modal Not Showing

1. Check SubscriptionPlans component mounted
2. Check button onClick handler
3. Check modal state
4. Clear browser cache

---

**Status**: ✅ Complete and Ready for Testing
**Version**: 2.0.0
**Date**: 2026-02-01
