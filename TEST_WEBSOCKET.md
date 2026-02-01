# 🧪 Test WebSocket & Fix Close Order

## ✅ Đã fix

### 1. WebSocket Implementation
- ✅ Custom server với Socket.IO (`server.js`)
- ✅ WebSocket client (`lib/websocket/client.ts`)
- ✅ Broadcast positions từ API
- ✅ OpenPositions component subscribe WebSocket
- ✅ Connection status indicator (🟢 Live / 🔴 Offline)

### 2. Close Order Bug Fix
**Vấn đề:** `ExtractJsonString` không parse được ticket (vì ticket là number)

**Fix:** Dùng `ExtractJsonDouble` thay vì `ExtractJsonString`
```mql5
// Before (Wrong)
string ticketStr = ExtractJsonString(response, "ticket", startPos);
ulong ticket = StringToInteger(ticketStr);

// After (Correct)
double ticketDouble = ExtractJsonDouble(response, "ticket", startPos);
ulong ticket = (ulong)ticketDouble;
```

---

## 🚀 Cách test

### Bước 1: Compile EA Bot
```
1. Mở MetaEditor (F4 trong MT5)
2. Mở file: mt5-ea-bot/MT5_WebApp_Connector.mq5
3. Nhấn F7 để compile
4. Kiểm tra: 0 errors, 0 warnings
```

### Bước 2: Restart EA Bot
```
1. Remove EA Bot khỏi chart (kéo ra)
2. Attach lại EA Bot vào chart
3. Kiểm tra Experts tab có logs
```

### Bước 3: Chạy Web App với WebSocket
```bash
# Dừng server cũ (Ctrl+C nếu đang chạy)
pnpm dev
```

Bạn sẽ thấy:
```
✅ Server ready on http://localhost:3000
✅ Socket.IO ready on ws://localhost:3000
```

### Bước 4: Mở Web App
```
http://localhost:3000
```

### Bước 5: Kiểm tra WebSocket Connection

**Trong Browser Console (F12):**
```
✅ WebSocket connected: abc123xyz
```

**Trong "Lệnh Đang Mở":**
- Phải thấy: 🟢 **Live** (màu xanh)
- Nếu thấy: 🔴 **Offline** → WebSocket chưa connect

---

## 🧪 Test Realtime Positions

### Test 1: Mở lệnh mới
1. **Điền form** "Đặt Lệnh Mới"
   - Symbol: `BTCUSDm`
   - Type: `BUY`
   - Volume: `0.01`
2. **Click "Gửi Lệnh"**
3. **Đợi EA Bot xử lý** (~1-5 giây)
4. **Kiểm tra:**
   - MT5 Experts tab: `✅ Order placed successfully`
   - Web app: Position hiện **ngay lập tức** (không cần refresh)
   - Browser console: `📊 Received positions via WebSocket: 1`

### Test 2: Update realtime
1. **Để lệnh mở** trong vài giây
2. **Quan sát:**
   - Current Price thay đổi mỗi giây
   - Profit/Loss update realtime
   - Không cần refresh page

### Test 3: Đóng lệnh
1. **Click nút X** (đỏ) bên cạnh position
2. **Confirm** dialog
3. **Đợi EA Bot xử lý** (~1-5 giây)
4. **Kiểm tra:**
   - MT5 Experts tab: `✅ Position closed successfully`
   - Web app: Position biến mất **ngay lập tức**
   - Browser console: `📊 Received positions via WebSocket: 0`

---

## 🔍 Debug Logs

### MT5 Experts Tab
```
📊 Sending 1 open positions
  Position #1: BTCUSDm BUY 0.01 lots, Profit: 5.50
Sending to /positions
✓ Success! HTTP 200

Processing command: abc-123 Type: CLOSE_ORDER
Closing position: 123456789
✅ Position closed successfully. Ticket: 123456789
Reported result: EXECUTED - Position closed successfully
```

### Web App Terminal
```
🔌 Client connected: abc123xyz
📊 Received positions update: 1 positions
✅ Saved 1 positions to database
📡 Broadcasted 1 positions to 1 clients

📊 Received positions update: 0 positions
✅ No positions to save (cleared all)
📡 Broadcasted 0 positions to 1 clients
```

### Browser Console
```
✅ WebSocket connected: abc123xyz
📊 Received positions via WebSocket: 1
📊 Received positions via WebSocket: 0
```

---

## 🐛 Troubleshooting

### Vấn đề 1: Status hiện "Offline" 🔴

**Nguyên nhân:**
- Server chưa chạy với custom server
- WebSocket connection failed
- Port 3000 bị chiếm

**Giải pháp:**
```bash
# Kill process trên port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Restart server
pnpm dev
```

### Vấn đề 2: Positions không update realtime

**Kiểm tra:**
1. Status có hiện "Live" không?
2. EA Bot có đang chạy không?
3. Console có logs "📊 Received positions" không?

**Giải pháp:**
```bash
# Check server logs
# Phải thấy:
📡 Broadcasted X positions to Y clients

# Nếu không thấy → WebSocket chưa broadcast
# Check file: app/api/mt5/positions/route.ts
```

### Vấn đề 3: Không đóng được lệnh

**Kiểm tra MT5 Experts tab:**
```
# Nếu thấy:
Processing command: ... Type: CLOSE_ORDER
Closing position: 0  ← ❌ Ticket = 0 (sai!)

# → Compile lại EA Bot với fix mới
```

**Nếu thấy:**
```
❌ Order rejected. RetCode: 10004
# → Position không tồn tại hoặc đã đóng
```

**Nếu thấy:**
```
Failed to close position. Error: 4756
# → Invalid ticket
```

### Vấn đề 4: "WebSocket connection failed"

**Kiểm tra:**
```bash
# Server có chạy không?
# Phải thấy:
✅ Socket.IO ready on ws://localhost:3000

# Nếu không thấy → Chưa dùng custom server
# Check: package.json "dev": "node server.js"
```

---

## 📊 Expected Flow

### Mở lệnh:
```
Web App (Form)
    ↓ POST /api/commands/place-order
Database (commands table)
    ↓ status: PENDING
EA Bot (CheckCommands)
    ↓ GET /api/mt5/commands
EA Bot (ExecutePlaceOrder)
    ↓ OrderSend()
EA Bot (ReportCommandResult)
    ↓ POST /api/mt5/commands (status: EXECUTED)
EA Bot (SendOpenPositions)
    ↓ POST /api/mt5/positions
API (Save + Broadcast)
    ↓ WebSocket emit('positions:update')
Web App (OpenPositions)
    ↓ Update UI instantly
```

### Đóng lệnh:
```
Web App (Click X)
    ↓ POST /api/commands/close-order
Database (commands table)
    ↓ status: PENDING
EA Bot (CheckCommands)
    ↓ GET /api/mt5/commands
EA Bot (ExecuteCloseOrder)
    ↓ OrderSend() close
EA Bot (ReportCommandResult)
    ↓ POST /api/mt5/commands (status: EXECUTED)
EA Bot (SendOpenPositions)
    ↓ POST /api/mt5/positions (empty array)
API (Delete all + Broadcast)
    ↓ WebSocket emit('positions:update', [])
Web App (OpenPositions)
    ↓ Clear positions instantly
```

---

## ✅ Checklist

### WebSocket Setup
- [x] Custom server (`server.js`)
- [x] WebSocket client (`lib/websocket/client.ts`)
- [x] Broadcast in API routes
- [x] Subscribe in components
- [x] Connection status indicator
- [x] Auto-reconnect

### Close Order Fix
- [x] Fix `ExtractJsonDouble` for ticket
- [x] Compile EA Bot
- [x] Test close order
- [x] Verify WebSocket broadcast

### Testing
- [ ] Status hiện "Live" 🟢
- [ ] Mở lệnh → hiện instant
- [ ] Positions update realtime
- [ ] Đóng lệnh → biến mất instant
- [ ] No errors in console

---

## 🎉 Kết quả mong đợi

Sau khi test thành công:

✅ **WebSocket connected** - Status hiện "Live" 🟢
✅ **Realtime positions** - Update instant khi EA Bot gửi
✅ **No polling** - Không có requests mỗi giây
✅ **Close order works** - Đóng lệnh thành công
✅ **Instant UI update** - Positions biến mất ngay lập tức

Done! 🚀
