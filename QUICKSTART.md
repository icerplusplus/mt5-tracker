# ⚡ Quick Start Guide

Hướng dẫn nhanh để chạy MT5 Trading Dashboard trong 10 phút.

## 📋 Prerequisites

- Node.js 18+ và pnpm
- MetaTrader 5
- Tài khoản Supabase (free tier OK)

## 🚀 3 Bước Chính

### 1️⃣ Setup Supabase (3 phút)

```bash
# 1. Tạo project tại supabase.com
# 2. Copy URL và API keys
# 3. Chạy SQL trong lib/supabase/schema.sql
# 4. Enable Real-time cho tables: open_positions, account_history, bot_status, trades
```

### 2️⃣ Setup Web App (2 phút)

```bash
# Install
pnpm install

# Configure
cp .env.local.example .env.local
# Edit .env.local với Supabase credentials

# Run
pnpm dev
# → http://localhost:3000
```

### 3️⃣ Setup EA Bot (5 phút)

```bash
# 1. Copy mt5-ea-bot/MT5_WebApp_Connector.mq5 vào MT5/MQL5/Experts/
# 2. Mở MetaEditor, compile (F7)
# 3. MT5: Tools → Options → Expert Advisors
#    ✅ Allow WebRequest for: http://localhost:3000/api/mt5
# 4. Kéo EA vào chart
# 5. Check API_KEY khớp với .env.local
```

## ✅ Verify

1. **Web Dashboard**: Refresh sau 10 giây → thấy Bot Status "Đang chạy"
2. **MT5**: Check Experts tab → thấy "MT5 WebApp Connector initialized"
3. **Supabase**: Table Editor → bot_status có data

## 🎯 Test Features

```bash
# Test đặt lệnh
1. Dashboard → "Đặt Lệnh Mới"
2. Symbol: EURUSD, Type: BUY, Volume: 0.01
3. Click "Gửi Lệnh"
4. Sau 5-10s → lệnh xuất hiện trong MT5

# Test đóng lệnh
1. Dashboard → "Lệnh Đang Mở"
2. Click nút ❌
3. Sau 5-10s → lệnh đóng trong MT5
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| EA không gửi data | Check WebRequest allowed URL |
| Dashboard trống | Check .env.local credentials |
| Commands không chạy | Check API_KEY khớp |
| WebRequest Error -1 | Add URL vào Tools → Options |

## 📚 Full Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Chi tiết từng bước
- [README.md](./README.md) - Tổng quan hệ thống
- [lib/supabase/schema.sql](./lib/supabase/schema.sql) - Database schema

## 🎉 Done!

Bây giờ bạn có:
- ✅ Real-time dashboard
- ✅ Remote order placement
- ✅ Bot control từ web
- ✅ Statistics & charts

**Happy Trading! 📈**
