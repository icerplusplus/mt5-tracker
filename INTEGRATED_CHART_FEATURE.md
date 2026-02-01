# 📊 Integrated Chart Feature

## Tổng quan

Chart giờ đây được **tích hợp trực tiếp** vào component "Lệnh Đang Mở":
- ✅ Hiển thị luôn ở trên bảng positions
- ✅ Tự động chọn symbol của position đầu tiên
- ✅ Dropdown để chuyển đổi giữa các symbols
- ✅ Hiển thị tất cả positions của symbol đang chọn
- ✅ Price lines cho Open, Current, SL, TP
- ✅ Realtime updates qua WebSocket

---

## 🎯 Layout

```
┌─────────────────────────────────────────────────┐
│ Lệnh Đang Mở (2)                    [🟢 Live]  │
├─────────────────────────────────────────────────┤
│ Chart Section                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Eur/Usd [▼] [M5 ▼]    [BUY] $5.00          │ │
│ ├─────────────────────────────────────────────┤ │
│ │                                             │ │
│ │         [Candlestick Chart]                 │ │
│ │                                             │ │
│ ├─────────────────────────────────────────────┤ │
│ │ ─ ─ Open: 1.08500  ─── Current: 1.08550   │ │
│ │ ─ ─ SL: 1.08400    ─ ─ TP: 1.08700        │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Positions Table                                 │
│ Ticket | Symbol | Type | Volume | ... | [X]    │
│ 123456 | EURUSD | BUY  | 0.01   | ... | [X]    │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Features

### 1. Auto Symbol Selection
- Khi mở lệnh mới → Chart tự động hiển thị symbol đó
- Khi có nhiều symbols → Chọn symbol đầu tiên
- Khi đóng hết lệnh → Chart ẩn đi

### 2. Symbol Selector
```tsx
<select value={selectedSymbol} onChange={...}>
  {uniqueSymbols.map(symbol => (
    <option>{formatSymbol(symbol)}</option>
  ))}
</select>
```

Dropdown hiển thị tất cả symbols đang có positions.

### 3. Timeframe Selector
- M1, M5, M15, M30, H1, H4, D1
- Thay đổi timeframe → Chart reload tự động

### 4. Position Info Bar
Hiển thị ngay trên chart:
- **Type badge**: BUY (xanh) / SELL (đỏ)
- **Profit/Loss**: Màu xanh/đỏ theo lãi/lỗ
- Nếu có nhiều positions cùng symbol → Hiện tất cả

### 5. Price Lines
Mỗi position có các đường:
- **Open Price** (nét đứt, xanh/đỏ): Giá mở lệnh
- **Current Price** (liền, xanh dương): Giá hiện tại
- **Stop Loss** (nét đứt, đỏ): SL nếu có
- **Take Profit** (nét đứt, xanh): TP nếu có

### 6. Legend
Dưới chart hiển thị:
- Open: 1.08500
- Current: 1.08550
- SL: 1.08400 (nếu có)
- TP: 1.08700 (nếu có)

---

## 🔄 Realtime Updates

### Price Lines Update
```typescript
// Khi positions update qua WebSocket
useEffect(() => {
  updatePriceLines(); // Update current price line
}, [positions]);
```

Current price line tự động di chuyển theo giá realtime.

### Chart Data Update
- EA Bot gửi chart data mỗi 30 giây
- Chart tự động thêm bars mới
- Price lines update theo positions

---

## 💡 Use Cases

### Case 1: Single Position
```
Symbol: EUR/USD
Positions: 1 BUY

Chart shows:
- 1 open price line (xanh, nét đứt)
- 1 current price line (xanh dương)
- SL/TP lines nếu có
```

### Case 2: Multiple Positions Same Symbol
```
Symbol: EUR/USD
Positions: 
  - BUY 0.01 @ 1.08500
  - BUY 0.02 @ 1.08520

Chart shows:
- 2 open price lines (xanh, nét đứt)
- 2 current price lines (xanh dương)
- Multiple SL/TP lines
```

### Case 3: Multiple Symbols
```
Positions:
  - EUR/USD BUY
  - GBP/USD SELL
  - XAU/USD BUY

Chart shows:
- Dropdown: [EUR/USD ▼]
- Chọn symbol để xem chart tương ứng
```

---

## 🎯 Workflow

### Mở lệnh mới
```
1. User điền form → Click "Gửi Lệnh"
2. EA Bot execute → Position created
3. WebSocket broadcast positions
4. OpenPositions component receives update
5. Chart auto-select symbol
6. Chart loads data
7. Price lines added
```

### Đóng lệnh
```
1. User click X → Confirm
2. EA Bot close position
3. WebSocket broadcast positions (empty or updated)
4. Chart removes price lines
5. If no positions left → Chart hides
```

### Chuyển symbol
```
1. User select symbol from dropdown
2. Chart clears old data
3. Chart loads new symbol data
4. Price lines update for new symbol
```

---

## 🔧 Technical Details

### Chart Configuration
```typescript
height: 300,  // Compact height
layout: {
  background: { color: '#111827' },  // Dark background
  textColor: '#9CA3AF',
},
```

### Price Line Management
```typescript
const priceLinesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

// Add line
priceLinesRef.current.set(`open_${ticket}`, openLine);

// Update line
openLine.update({ time: now, value: price });

// Remove line
chartRef.current?.removeSeries(line);
priceLinesRef.current.clear();
```

### Symbol Filtering
```typescript
// Get unique symbols
const uniqueSymbols = Array.from(new Set(positions.map(p => p.symbol)));

// Get positions for selected symbol
const symbolPositions = positions.filter(p => p.symbol === selectedSymbol);
```

---

## 🎨 Styling

### Chart Container
```css
border: 1px solid #1F2937
border-radius: 0.5rem
overflow: hidden
```

### Chart Header
```css
background: rgba(31, 41, 55, 0.5)
padding: 0.75rem 1rem
border-bottom: 1px solid #1F2937
```

### Legend
```css
background: rgba(31, 41, 55, 0.3)
padding: 0.5rem 1rem
font-size: 0.75rem
border-top: 1px solid #1F2937
```

---

## 📱 Responsive

### Desktop (> 1024px)
- Chart height: 300px
- Full legend visible
- All info displayed

### Tablet (768px - 1024px)
- Chart height: 250px
- Compact legend
- Scrollable if needed

### Mobile (< 768px)
- Chart height: 200px
- Minimal legend
- Stack layout

---

## 🐛 Troubleshooting

### Chart không hiển thị

**Kiểm tra:**
1. Có positions không?
2. selectedSymbol có value không?
3. Console có errors không?

**Giải pháp:**
```typescript
// Check state
console.log('Positions:', positions);
console.log('Selected Symbol:', selectedSymbol);
```

### Price lines không update

**Nguyên nhân:** WebSocket không broadcast

**Giải pháp:**
- Check WebSocket status (phải "Live")
- Check EA Bot logs
- Restart server

### Chart bị lag

**Nguyên nhân:** Quá nhiều price lines

**Giải pháp:**
```typescript
// Limit positions per symbol
const MAX_POSITIONS = 5;
const symbolPositions = positions
  .filter(p => p.symbol === selectedSymbol)
  .slice(0, MAX_POSITIONS);
```

---

## ✅ Advantages

### So với Modal Chart:
- ✅ **Luôn hiển thị**: Không cần click
- ✅ **Compact**: Tiết kiệm không gian
- ✅ **Context**: Xem chart + positions cùng lúc
- ✅ **Quick switch**: Dropdown thay vì modal
- ✅ **Better UX**: Ít clicks hơn

### So với Separate Chart:
- ✅ **Integrated**: Một component duy nhất
- ✅ **Synchronized**: Chart + positions sync
- ✅ **Efficient**: Ít re-renders
- ✅ **Clean**: Không có duplicate code

---

## 🎉 Kết quả

Bây giờ bạn có:
- ✅ Chart tích hợp trực tiếp
- ✅ Auto symbol selection
- ✅ Multiple positions support
- ✅ Realtime price lines
- ✅ Clean, compact UI
- ✅ No modal needed

Done! 🚀
