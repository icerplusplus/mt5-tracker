# 📊 Position Chart Feature

## Tổng quan

Tính năng mới: **Xem chart cho từng position đang mở**

Khi có lệnh đang mở, bạn có thể click vào nút chart để xem:
- ✅ Biểu đồ nến (candlestick) của symbol
- ✅ Open price line (giá mở lệnh)
- ✅ Current price line (giá hiện tại)
- ✅ Stop Loss line (nếu có)
- ✅ Take Profit line (nếu có)
- ✅ Volume histogram
- ✅ Realtime updates

---

## 🎯 Cách sử dụng

### Bước 1: Mở lệnh
1. Điền form "Đặt Lệnh Mới"
2. Click "Gửi Lệnh"
3. Đợi position hiện trong "Lệnh Đang Mở"

### Bước 2: Xem chart
1. Trong bảng "Lệnh Đang Mở"
2. Click nút **📊** (màu xanh) bên cạnh position
3. Chart modal sẽ hiện ra

### Bước 3: Phân tích
Chart hiển thị:
- **Nến xanh/đỏ**: Giá tăng/giảm
- **Đường nét đứt** (xanh/đỏ): Open price
- **Đường liền** (xanh dương): Current price
- **Đường đỏ nét đứt**: Stop Loss (nếu có)
- **Đường xanh lá nét đứt**: Take Profit (nếu có)

### Bước 4: Thay đổi timeframe
- Chọn timeframe: M1, M5, M15, M30, H1, H4, D1
- Chart tự động reload với timeframe mới

### Bước 5: Đóng chart
- Click nút **X** ở góc trên bên phải
- Hoặc click ra ngoài modal

---

## 🎨 UI Features

### Chart Modal
```
┌─────────────────────────────────────────────┐
│ EUR/USD [BUY]                    [M5] [X]   │
│ Ticket: 123456 • Volume: 0.01 lots          │
├─────────────────────────────────────────────┤
│ Open: 1.08500 | Current: 1.08550            │
│ Profit: $5.00 | SL: 1.08400 | TP: 1.08700  │
├─────────────────────────────────────────────┤
│                                             │
│           [Candlestick Chart]               │
│                                             │
│ ─ ─ Open Price  ─── Current Price          │
│ ─ ─ Stop Loss   ─ ─ Take Profit            │
└─────────────────────────────────────────────┘
```

### Position Info Bar
Hiển thị thông tin chi tiết:
- **Open Price**: Giá mở lệnh (màu xám)
- **Current Price**: Giá hiện tại (màu xanh dương)
- **Profit/Loss**: Lãi/lỗ (màu xanh/đỏ)
- **Stop Loss**: SL (màu đỏ, hoặc "-" nếu không có)
- **Take Profit**: TP (màu xanh, hoặc "-" nếu không có)

### Actions Column
Trong bảng "Lệnh Đang Mở", mỗi position có 2 nút:
- **📊** (xanh): Xem chart
- **✕** (đỏ): Đóng lệnh

---

## 🔧 Technical Details

### Component: PositionChart.tsx

**Props:**
```typescript
interface PositionChartProps {
  position: Position;  // Position data
  onClose: () => void; // Close callback
}
```

**Features:**
- Lightweight Charts library
- Candlestick + Volume
- Multiple price lines
- Responsive design
- WebSocket realtime updates

### Price Lines

**Open Price Line:**
```typescript
color: position.type === 'BUY' ? '#26A69A' : '#EF5350',
lineStyle: 2, // Dashed
```

**Current Price Line:**
```typescript
color: '#3B82F6', // Blue
lineWidth: 2,
```

**Stop Loss Line:**
```typescript
color: '#EF4444', // Red
lineStyle: 2, // Dashed
```

**Take Profit Line:**
```typescript
color: '#10B981', // Green
lineStyle: 2, // Dashed
```

---

## 📊 Chart Data Flow

```
EA Bot (SendChartData)
    ↓ POST /api/mt5/chart-data
Supabase (chart_data table)
    ↓ WebSocket broadcast
PositionChart Component
    ↓ Update chart realtime
```

---

## 🎯 Use Cases

### 1. Theo dõi entry point
- Xem giá đã di chuyển bao xa từ open price
- Đánh giá timing của entry

### 2. Quản lý risk
- Kiểm tra khoảng cách tới SL/TP
- Xem support/resistance levels

### 3. Phân tích trend
- Xem trend hiện tại của symbol
- Quyết định hold hay close position

### 4. Multiple timeframes
- Xem M5 cho short-term
- Xem H1/H4 cho big picture
- Xem D1 cho long-term trend

---

## 🔍 Example Scenarios

### Scenario 1: BUY position in profit
```
Symbol: EUR/USD
Type: BUY
Open: 1.08500
Current: 1.08550
Profit: +$5.00

Chart shows:
- Price đang trên open price ✅
- Trend đang đi lên ✅
- Chưa chạm TP ⏳
```

### Scenario 2: SELL position near SL
```
Symbol: GBP/USD
Type: SELL
Open: 1.27500
Current: 1.27480
SL: 1.27450
Profit: +$2.00

Chart shows:
- Price đang gần SL ⚠️
- Có thể bị stop out
- Cân nhắc close manual
```

### Scenario 3: Position consolidating
```
Symbol: XAU/USD
Type: BUY
Open: 2050.00
Current: 2051.00
Profit: +$1.00

Chart shows:
- Price đang sideway ➡️
- Chưa có breakout
- Đợi thêm signal
```

---

## 🎨 Customization

### Thay đổi màu sắc

**File:** `app/components/PositionChart.tsx`

```typescript
// Candlestick colors
upColor: '#26A69A',    // Green
downColor: '#EF5350',  // Red

// Price line colors
openPriceColor: position.type === 'BUY' ? '#26A69A' : '#EF5350',
currentPriceColor: '#3B82F6',  // Blue
slColor: '#EF4444',            // Red
tpColor: '#10B981',            // Green
```

### Thay đổi chart height

```typescript
height: 400,  // Đổi thành 500, 600, etc.
```

### Thêm indicators

```typescript
// Add MA line
const maSeries = chart.addLineSeries({
  color: '#FFA500',
  lineWidth: 1,
  title: 'MA 20'
});
```

---

## 🐛 Troubleshooting

### Chart không hiển thị

**Kiểm tra:**
1. EA Bot có gửi chart data không?
2. Database có dữ liệu không?
3. Console có errors không?

**Giải pháp:**
```bash
# Check EA Bot logs
# Phải thấy: "Sent X bars for SYMBOL"

# Check database
SELECT * FROM chart_data WHERE symbol = 'EURUSD' LIMIT 10;

# Check browser console
# Phải thấy: "Loading chart data..."
```

### Price lines không hiện

**Nguyên nhân:** Data chưa load xong

**Giải pháp:**
- Đợi chart load xong
- Click "Refresh" nếu cần

### Chart bị lag

**Nguyên nhân:** Quá nhiều data points

**Giải pháp:**
```typescript
// Giảm limit
const res = await fetch(`...&limit=100`); // Thay vì 200
```

---

## 📱 Responsive Design

### Desktop (> 1024px)
- Modal width: max-w-6xl
- Chart height: 400px
- Full features

### Tablet (768px - 1024px)
- Modal width: max-w-4xl
- Chart height: 350px
- Compact layout

### Mobile (< 768px)
- Modal width: 95vw
- Chart height: 300px
- Scrollable content

---

## ✅ Checklist

- [x] PositionChart component
- [x] Chart button in OpenPositions
- [x] Modal overlay
- [x] Candlestick chart
- [x] Volume histogram
- [x] Open price line
- [x] Current price line
- [x] SL/TP lines
- [x] Timeframe selector
- [x] Position info bar
- [x] Close button
- [x] Responsive design
- [x] WebSocket updates

---

## 🎉 Kết quả

Bây giờ bạn có thể:
- ✅ Xem chart cho mỗi position
- ✅ Theo dõi price movement realtime
- ✅ Phân tích entry/exit points
- ✅ Quản lý risk tốt hơn
- ✅ Đưa ra quyết định sáng suốt

Done! 🚀
