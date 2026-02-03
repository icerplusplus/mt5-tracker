# Pusher Setup Guide - Thay thế WebSocket

## 🎯 Tại sao chuyển sang Pusher?

### Vấn đề với WebSocket tự host:
- ❌ Cần maintain VPS riêng cho WebSocket server
- ❌ Phức tạp khi scale (multiple instances)
- ❌ Vercel không support WebSocket (serverless)
- ❌ Có thể gây reload liên tục nếu config sai
- ❌ Cần handle reconnection logic phức tạp

### Lợi ích của Pusher:
- ✅ Managed service - không cần maintain server
- ✅ Auto-scaling - handle unlimited connections
- ✅ Hoạt động tốt với Vercel (serverless)
- ✅ Stable connection - ít reload hơn
- ✅ Built-in reconnection & fallback
- ✅ Free tier: 200k messages/day, 100 connections
- ✅ Dashboard để monitor realtime

## 📋 Bước 1: Tạo Pusher Account

1. **Truy cập:** https://pusher.com/
2. **Sign up** (miễn phí)
3. **Create new app:**
   - App name: `mt5-trading-dashboard`
   - Cluster: `ap1` (Asia Pacific - Singapore)
   - Tech stack: `React` (hoặc `Next.js`)

## 🔑 Bước 2: Lấy Credentials

Sau khi tạo app, vào **App Keys** tab:

```
App ID: 1234567
Key: abcdef123456
Secret: xyz789secret
Cluster: ap1
```

## ⚙️ Bước 3: Cấu hình Environment Variables

### Local Development (`.env.local`):

```env
# Pusher Configuration
NEXT_PUBLIC_PUSHER_APP_KEY=abcdef123456
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
PUSHER_APP_ID=1234567
PUSHER_SECRET=xyz789secret
```

### Vercel Production:

Vercel Dashboard → Settings → Environment Variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_PUSHER_APP_KEY` | `abcdef123456` | Production, Preview, Development |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `ap1` | Production, Preview, Development |
| `PUSHER_APP_ID` | `1234567` | Production, Preview, Development |
| `PUSHER_SECRET` | `xyz789secret` | Production, Preview, Development |

**Lưu ý:** Biến bắt đầu với `NEXT_PUBLIC_` sẽ được expose ra client-side.

## 🔧 Bước 4: Cài đặt Dependencies

```bash
pnpm add pusher pusher-js
```

## 📊 Bước 5: Kiểm tra hoạt động

### Test trên Local:

```bash
pnpm dev
```

Mở browser console (F12), bạn sẽ thấy:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔌 Pusher Client Initialization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment Info:
   NODE_ENV: development
   Is Production: false
   Is Vercel: false

🔗 Pusher Config:
   App Key: abcdef1234...
   Cluster: ap1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Pusher Connected Successfully!
   Socket ID: 123456.789012
   State: connected
```

### Monitor trên Pusher Dashboard:

1. Truy cập: https://dashboard.pusher.com/
2. Chọn app: `mt5-trading-dashboard`
3. Tab **Debug Console**
4. Bạn sẽ thấy:
   - Connection events
   - Messages sent/received
   - Channel subscriptions

## 📡 Bước 6: Test Realtime Updates

### Trigger từ EA Bot:

Khi EA Bot gửi data tới API routes, Pusher sẽ broadcast:

```
📡 [PUSHER] Broadcasted 5 positions
📡 [PUSHER] Broadcasted account info
📡 [PUSHER] Broadcasted bot status: RUNNING
```

### Nhận trên Client:

Browser console sẽ hiển thị:

```
📡 Subscribed to channel: mt5-channel
📡 Listening to mt5-channel:positions-update
📡 Listening to mt5-channel:account-update
📡 Listening to mt5-channel:bot-status
```

## 🔄 Migration từ WebSocket

### Đã thay đổi:

1. **Client:**
   - `lib/websocket/client.ts` → `lib/pusher/client.ts`
   - `getSocket()` → `getPusherClient()`
   - Socket.IO events → Pusher channels

2. **Server:**
   - `lib/websocket/server.ts` → `lib/pusher/server.ts`
   - `broadcastXXX()` functions giữ nguyên signature

3. **API Routes:**
   - Import từ `@/lib/pusher/server` thay vì `@/lib/websocket/server`
   - Logic không thay đổi

4. **Components:**
   - Dùng `usePusher()` hook thay vì `getSocket()`
   - Event names thay đổi:
     - `positions:update` → `positions-update`
     - `account:update` → `account-update`
     - `bot:status` → `bot-status`
     - `trade:new` → `trade-new`
     - `chart:update` → `chart-update`
     - `tick:update` → `tick-update`

### Không cần nữa:

- ❌ VPS WebSocket server (`websocket-server/`)
- ❌ PM2 configuration
- ❌ Firewall rules cho port 3001
- ❌ ALLOWED_ORIGINS configuration
- ❌ Manual reconnection logic

## 📈 Pusher Limits (Free Tier)

- **Connections:** 100 concurrent
- **Messages:** 200,000/day
- **Channels:** Unlimited
- **Message size:** 10KB max

**Nếu vượt quá:**
- Upgrade to paid plan ($49/month for 500 connections)
- Hoặc optimize message frequency

## 🎯 Channels & Events

### Channel: `mt5-channel`

| Event | Data | Frequency |
|-------|------|-----------|
| `positions-update` | Array of positions | Every 0.5s (from EA Bot) |
| `account-update` | Account info object | Every 0.5s (from EA Bot) |
| `bot-status` | Bot status object | On change |
| `trade-new` | Trade object | On new trade |
| `chart-update` | Chart bar object | On new bar |
| `tick-update` | Tick object | Every tick (~1s) |

## 🔍 Debugging

### Check Pusher Connection:

```javascript
// Browser console
const pusher = getPusherClient();
console.log('State:', pusher.connection.state);
console.log('Socket ID:', pusher.connection.socket_id);
```

### Monitor Messages:

Pusher Dashboard → Debug Console → See all events in realtime

### Common Issues:

**1. Connection failed:**
- Check `NEXT_PUBLIC_PUSHER_APP_KEY` is set
- Verify cluster is correct (`ap1`)
- Check Pusher app is active

**2. No messages received:**
- Check API routes are calling `broadcastXXX()`
- Verify channel name matches (`mt5-channel`)
- Check Pusher dashboard for errors

**3. Too many messages:**
- Pusher free tier: 200k messages/day
- Optimize broadcast frequency
- Consider batching updates

## ✨ Advantages

### Stability:
- ✅ No more reload issues
- ✅ Automatic reconnection
- ✅ Fallback to polling if WebSocket fails

### Scalability:
- ✅ Handle unlimited clients
- ✅ No server maintenance
- ✅ Auto-scaling

### Development:
- ✅ Works on localhost
- ✅ Works on Vercel
- ✅ Same code for dev & production

### Monitoring:
- ✅ Dashboard với realtime stats
- ✅ Debug console
- ✅ Connection analytics

## 🚀 Deploy

### Local:
```bash
pnpm dev
```

### Vercel:
```bash
git add .
git commit -m "feat: Replace WebSocket with Pusher"
git push
```

Vercel sẽ tự động deploy. Đảm bảo environment variables đã được set!

## 📚 Documentation

- **Pusher Docs:** https://pusher.com/docs/
- **Pusher Channels:** https://pusher.com/docs/channels/
- **React Integration:** https://pusher.com/docs/channels/getting_started/react/

## 🎉 Kết luận

Bây giờ bạn có:
- ✅ Realtime updates stable hơn
- ✅ Không cần maintain VPS WebSocket server
- ✅ Hoạt động tốt trên Vercel
- ✅ Dashboard để monitor
- ✅ Free tier đủ dùng cho development

Không còn lo về reload issues! 🚀
