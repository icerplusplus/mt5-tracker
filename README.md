# MT5 Trading Dashboard

Real-time MetaTrader 5 trading dashboard với EA Bot integration. Hệ thống cho phép giám sát và điều khiển trading bot từ web interface.

## 🎯 Tính Năng

### Dashboard (Web App)
- ✅ **Real-time Account Info**: Balance, Equity, Margin, Profit
- ✅ **Bot Status**: Trạng thái bot (Running/Paused/Stopped)
- ✅ **Open Positions**: Danh sách lệnh đang mở với profit real-time
- ✅ **Trade History**: Lịch sử giao dịch
- ✅ **Statistics**: Thống kê theo ngày/tuần/tháng/năm
- ✅ **Order Form**: Đặt lệnh mới từ web
- ✅ **Bot Controls**: Tạm dừng/Tiếp tục bot
- ✅ **Close Orders**: Đóng lệnh từ web interface
- ✅ **Trading Chart**: Chart với TradingView-style interface
- ✅ **Realtime Candles**: Nến cập nhật theo giá thị trường mỗi giây
- ✅ **Position Markers**: Hiển thị entry, current, SL, TP trên chart
- ✅ **Symbol Search**: Modal tìm kiếm symbol với watchlist
- ✅ **Timeframe Selector**: Chọn khung thời gian (M1 đến MN1)
- ✅ **Account Type Detection**: Tự động phát hiện Dollar/Cent account
- ✅ **Mobile Responsive**: Layout tối ưu cho mobile
- ✅ **Professional UI**: Giao diện trading platform chuyên nghiệp

### EA Bot (MetaTrader 5)
- ✅ Gửi dữ liệu real-time lên web app
- ✅ Gửi tick data mỗi giây cho realtime candles
- ✅ Nhận lệnh từ web app
- ✅ Đặt lệnh tự động
- ✅ Đóng lệnh theo lệnh từ web
- ✅ Tạm dừng/Tiếp tục theo lệnh
- ✅ Gửi chart data theo symbol và timeframe

## 📦 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Real-time**: WebSocket (Socket.IO) + Supabase subscriptions
- **Charts**: Lightweight Charts (TradingView)
- **Icons**: Lucide React
- **EA Bot**: MQL5

## 🚀 Cài Đặt

### 1. Setup Supabase

1. Tạo project mới tại [supabase.com](https://supabase.com)
2. Copy URL và API keys
3. Chạy SQL trong `lib/supabase/schema.sql` tại SQL Editor

### 2. Setup Web App

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local với Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
# MT5_API_KEY=your_secure_key

# Run development server
pnpm dev
```

### 3. Setup EA Bot (MetaTrader 5)

1. Mở MetaTrader 5
2. Mở MetaEditor (F4)
3. Copy file `mt5-ea-bot/MT5_WebApp_Connector.mq5` vào thư mục `MQL5/Experts/`
4. Compile (F7)
5. **Quan trọng**: Thêm URL vào allowed list:
   - Tools → Options → Expert Advisors
   - Check "Allow WebRequest for listed URL"
   - Add: `http://localhost:3000/api/mt5`
6. Kéo EA vào chart
7. Cấu hình parameters:
   - `API_URL`: http://localhost:3000/api/mt5
   - `API_KEY`: (same as MT5_API_KEY in .env.local)
   - `UPDATE_INTERVAL`: 5 (seconds)

## 📊 Cấu Trúc Database

### Tables

- **trades**: Lịch sử giao dịch đã đóng
- **open_positions**: Lệnh đang mở
- **account_history**: Lịch sử tài khoản
- **bot_status**: Trạng thái bot
- **commands**: Lệnh điều khiển từ web → EA
- **statistics**: Thống kê tổng hợp

## 🔄 Luồng Dữ Liệu

### EA Bot → Web App (Real-time Updates)

```
EA Bot (every 5s)
  ↓ HTTP POST
API Routes (/api/mt5/*)
  ↓ Insert/Update
Supabase Database
  ↓ Real-time Subscription
Frontend Components
  ↓ Update UI
User sees real-time data
```

### Web App → EA Bot (Commands)

```
User clicks button
  ↓ HTTP POST
API Routes (/api/commands/*)
  ↓ Insert command
Supabase Database
  ↓ EA Bot polls (every 5s)
EA Bot GET /api/mt5/commands
  ↓ Execute command
EA Bot POST result back
```

## 📡 API Endpoints

### Nhận Dữ Liệu từ EA Bot

```
POST /api/mt5/account-info    # Account balance, equity, margin
POST /api/mt5/positions        # Open positions
POST /api/mt5/trades           # Trade history
POST /api/mt5/bot-status       # Bot status & heartbeat
```

### Gửi Lệnh từ Web App

```
POST /api/commands/place-order   # Đặt lệnh mới
POST /api/commands/close-order   # Đóng lệnh
POST /api/commands/bot-control   # Pause/Resume bot
```

### EA Bot Polling

```
GET /api/mt5/commands           # EA Bot lấy pending commands
POST /api/mt5/commands          # EA Bot báo kết quả
```

### Statistics

```
GET /api/statistics?period=DAILY|WEEKLY|MONTHLY|YEARLY
```

## 🔐 Security

- API Key authentication cho EA Bot
- Row Level Security (RLS) trên Supabase
- Environment variables cho sensitive data
- HTTPS recommended cho production

## 📈 Statistics Features

- **Win Rate**: Tỷ lệ thắng/thua
- **Net Profit**: Lợi nhuận ròng
- **Profit Factor**: Tỷ lệ profit/loss
- **Max Drawdown**: Drawdown tối đa
- **Average Profit**: Lợi nhuận trung bình
- Charts: Win/Loss distribution, Profit vs Loss

## 🎨 UI Features

- Dark mode optimized
- Responsive design
- Real-time updates (no refresh needed)
- Color-coded profit/loss
- Interactive charts
- Toast notifications

## 🛠️ Development

```bash
# Development
pnpm dev

# Build
pnpm build

# Start production
pnpm start

# Lint
pnpm lint
```

## 📝 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Security
MT5_API_KEY=your_secure_random_key

# WebSocket (optional)
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### EA Bot không kết nối

1. Check URL trong allowed list (Tools → Options)
2. Check API_KEY khớp với .env.local
3. Check firewall/antivirus
4. Check EA Bot logs trong MetaTrader

### Real-time không update

1. Check Supabase connection
2. Check browser console for errors
3. Refresh page
4. Check Supabase Real-time enabled

### Commands không execute

1. Check EA Bot đang chạy
2. Check polling interval (default 5s)
3. Check commands table trong Supabase
4. Check EA Bot logs

## 📚 Tài Liệu Thêm

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [MQL5 Documentation](https://www.mql5.com/en/docs)
- [MetaTrader 5 WebRequest](https://www.mql5.com/en/docs/common/webrequest)

## 🎯 Roadmap

- [x] WebSocket cho real-time nhanh hơn
- [x] Advanced charting (TradingView/Lightweight Charts)
- [x] Realtime candlestick updates
- [x] Position markers on chart
- [x] Symbol search with watchlist
- [x] Timeframe selector
- [x] Account type detection
- [x] Mobile responsive layout
- [ ] Multiple EA Bot support
- [ ] Mobile app (React Native)
- [ ] Telegram notifications
- [ ] Risk management tools
- [ ] Backtesting integration
- [ ] Multi-account support

## 📄 License

MIT

## 👨‍💻 Author

MT5 Trading Dashboard Team

---

**⚠️ Disclaimer**: Trading involves risk. This software is for educational purposes. Use at your own risk.
