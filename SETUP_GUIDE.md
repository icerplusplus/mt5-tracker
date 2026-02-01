# 📖 Hướng Dẫn Setup Chi Tiết

## Bước 1: Setup Supabase Database

### 1.1 Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com)
2. Click "New Project"
3. Điền thông tin:
   - Name: `mt5-trading-dashboard`
   - Database Password: (tạo password mạnh)
   - Region: (chọn gần nhất)
4. Click "Create new project" và đợi ~2 phút

### 1.2 Lấy API Credentials

1. Vào project dashboard
2. Click Settings (⚙️) → API
3. Copy các thông tin sau:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` (giữ bí mật!)

### 1.3 Tạo Database Schema

1. Click SQL Editor (📝) ở sidebar
2. Click "New query"
3. Copy toàn bộ nội dung file `lib/supabase/schema.sql`
4. Paste vào editor
5. Click "Run" (hoặc Ctrl+Enter)
6. Kiểm tra: Vào Table Editor, bạn sẽ thấy 7 tables mới

### 1.4 Enable Real-time

1. Vào Database → Replication
2. Enable real-time cho các tables:
   - `open_positions`
   - `account_history`
   - `bot_status`
   - `trades`
3. Click "Save"

---

## Bước 2: Setup Web Application

### 2.1 Install Dependencies

```bash
# Đảm bảo đã cài pnpm
npm install -g pnpm

# Install dependencies
pnpm install
```

### 2.2 Configure Environment Variables

```bash
# Copy example file
cp .env.local.example .env.local

# Edit .env.local
nano .env.local  # hoặc dùng editor bất kỳ
```

Điền thông tin:

```env
# Supabase (từ bước 1.2)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# API Security (tạo random string)
MT5_API_KEY=your_secure_random_key_here_min_32_chars

# WebSocket
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

**Tạo API Key an toàn:**
```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 2.3 Run Development Server

```bash
pnpm dev
```

Mở browser: http://localhost:3000

Bạn sẽ thấy dashboard (chưa có dữ liệu vì EA Bot chưa chạy)

---

## Bước 3: Setup MetaTrader 5 EA Bot

### 3.1 Chuẩn Bị

1. Mở MetaTrader 5
2. Đăng nhập vào tài khoản trading (demo hoặc real)
3. Mở MetaEditor: Menu → Tools → MetaQuotes Language Editor (hoặc F4)

### 3.2 Copy EA Bot Code

1. Trong MetaEditor: File → New → Expert Advisor (template)
2. Hoặc: File → Open Data Folder → MQL5 → Experts
3. Copy file `mt5-ea-bot/MT5_WebApp_Connector.mq5` vào thư mục Experts
4. Refresh Navigator trong MetaEditor (F5)

### 3.3 Configure EA Parameters

Mở file `MT5_WebApp_Connector.mq5` và sửa:

```mql5
input string API_URL = "http://localhost:3000/api/mt5";  // Giữ nguyên nếu chạy local
input string API_KEY = "your_secure_api_key_here";        // PHẢI KHỚP với .env.local
input int UPDATE_INTERVAL = 5;                             // 5 giây (có thể giảm xuống 1)
input int MAGIC_NUMBER = 123456;                           // Magic number cho orders
```

### 3.4 Compile EA

1. Click Compile (F7) hoặc nút Compile
2. Kiểm tra tab "Errors" - phải 0 errors, 0 warnings
3. Nếu có lỗi, check syntax

### 3.5 Enable WebRequest

**⚠️ QUAN TRỌNG - Bỏ qua bước này sẽ không hoạt động!**

1. Trong MT5: Tools → Options
2. Tab "Expert Advisors"
3. Check ✅ "Allow WebRequest for listed URL:"
4. Click "Add" và thêm:
   ```
   http://localhost:3000/api/mt5
   ```
5. Nếu deploy production, thêm domain thật:
   ```
   https://yourdomain.com/api/mt5
   ```
6. Click OK

### 3.6 Attach EA to Chart

1. Trong MT5, mở chart bất kỳ (VD: EURUSD M5)
2. Trong Navigator (Ctrl+N), tìm "MT5_WebApp_Connector"
3. Kéo thả EA vào chart
4. Dialog hiện ra:
   - Tab "Common":
     - ✅ Allow live trading
     - ✅ Allow DLL imports (nếu cần)
   - Tab "Inputs":
     - Kiểm tra API_URL và API_KEY
   - Click OK

### 3.7 Verify EA Running

1. Check góc phải trên chart: phải có mặt cười 😊 (không phải 😞)
2. Mở tab "Experts" (Ctrl+T → Experts)
3. Bạn sẽ thấy logs:
   ```
   MT5 WebApp Connector initialized
   API URL: http://localhost:3000/api/mt5
   ```

---

## Bước 4: Kiểm Tra Kết Nối

### 4.1 Check Web Dashboard

1. Refresh browser (http://localhost:3000)
2. Sau 5-10 giây, bạn sẽ thấy:
   - **Bot Status**: Đang chạy (màu xanh)
   - **Account Info**: Balance, Equity, Margin
   - **Open Positions**: Nếu có lệnh đang mở

### 4.2 Check Supabase

1. Vào Supabase → Table Editor
2. Check table `bot_status`: phải có 1 row với status "RUNNING"
3. Check table `account_history`: phải có data mới
4. Check table `open_positions`: nếu có lệnh đang mở

### 4.3 Test Place Order

1. Trong dashboard, tìm "Đặt Lệnh Mới"
2. Điền:
   - Symbol: EURUSD
   - Type: BUY
   - Volume: 0.01
3. Click "Gửi Lệnh"
4. Alert: "Lệnh đã được gửi!"
5. Sau 5-10 giây, check MT5 → lệnh sẽ được đặt

### 4.4 Test Close Order

1. Nếu có lệnh đang mở trong dashboard
2. Click nút ❌ (Close)
3. Confirm
4. Sau 5-10 giây, lệnh sẽ đóng trong MT5

---

## Bước 5: Troubleshooting

### ❌ EA Bot không gửi dữ liệu

**Nguyên nhân:**
- URL chưa được add vào WebRequest allowed list
- API_KEY không khớp
- Firewall/Antivirus block

**Giải pháp:**
1. Check MT5 Experts tab cho error logs
2. Re-check WebRequest settings (Bước 3.5)
3. Tắt firewall tạm thời để test
4. Check API_KEY trong EA và .env.local

### ❌ Dashboard không hiển thị dữ liệu

**Nguyên nhân:**
- Supabase credentials sai
- Real-time chưa enable
- EA Bot chưa chạy

**Giải pháp:**
1. Check browser console (F12) cho errors
2. Check .env.local credentials
3. Check Supabase → Table Editor → có data không?
4. Refresh page

### ❌ Commands không execute

**Nguyên nhân:**
- EA Bot không polling
- Command parsing lỗi

**Giải pháp:**
1. Check MT5 Experts tab
2. Check Supabase → commands table → status
3. Tăng UPDATE_INTERVAL lên 10 để dễ debug

### ❌ WebRequest Error -1

**Lỗi phổ biến nhất!**

```
WebRequest error: 4060
Make sure URL is added to allowed URLs
```

**Giải pháp:**
1. Tools → Options → Expert Advisors
2. Add URL chính xác: `http://localhost:3000/api/mt5`
3. Restart MT5
4. Re-attach EA

---

## Bước 6: Production Deployment

### 6.1 Deploy Web App

**Vercel (Recommended):**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

**Hoặc build manual:**

```bash
pnpm build
pnpm start
```

### 6.2 Update EA Bot

1. Sửa API_URL trong EA:
   ```mql5
   input string API_URL = "https://yourdomain.com/api/mt5";
   ```
2. Add domain vào WebRequest allowed list
3. Recompile và re-attach EA

### 6.3 Security Checklist

- [ ] Đổi MT5_API_KEY thành random string mạnh
- [ ] Enable HTTPS cho production
- [ ] Setup Supabase RLS policies
- [ ] Backup database định kỳ
- [ ] Monitor logs

---

## 📊 Sử Dụng Dashboard

### Real-time Monitoring

- **Account Info**: Tự động update mỗi 5 giây
- **Open Positions**: Real-time profit/loss
- **Bot Status**: Heartbeat indicator
- **Trade History**: Tự động thêm khi đóng lệnh

### Đặt Lệnh

1. Điền symbol (VD: EURUSD, GBPUSD)
2. Chọn BUY hoặc SELL
3. Nhập volume (lots)
4. Optional: SL, TP, Comment
5. Click "Gửi Lệnh"

### Đóng Lệnh

1. Tìm lệnh trong "Lệnh Đang Mở"
2. Click nút ❌
3. Confirm

### Điều Khiển Bot

- **Tạm Dừng**: Bot ngừng trading nhưng vẫn gửi data
- **Tiếp Tục**: Bot tiếp tục trading

### Xem Thống Kê

1. Chọn period: Ngày/Tuần/Tháng/Năm
2. Xem:
   - Win Rate
   - Net Profit
   - Profit Factor
   - Max Drawdown
   - Charts

---

## 🎯 Next Steps

1. **Customize EA Bot**: Thêm trading logic của bạn
2. **Add Indicators**: Integrate technical indicators
3. **Risk Management**: Thêm stop loss, take profit logic
4. **Notifications**: Telegram/Email alerts
5. **Backtesting**: Test strategies với historical data

---

## 📞 Support

Nếu gặp vấn đề:

1. Check logs trong MT5 Experts tab
2. Check browser console (F12)
3. Check Supabase logs
4. Re-read setup guide

---

**🎉 Chúc bạn trading thành công!**
