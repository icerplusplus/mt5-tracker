# Pusher Quick Start - 5 phút setup

## ⚡ Bước 1: Tạo Pusher Account (2 phút)

1. Truy cập: https://pusher.com/
2. Click **Sign up** (miễn phí)
3. Đăng ký bằng email hoặc GitHub

## 🔑 Bước 2: Tạo App (1 phút)

1. Click **Create app**
2. Điền thông tin:
   - **App name:** `mt5-trading-dashboard`
   - **Cluster:** `ap1` (Asia Pacific - Singapore)
   - **Tech stack:** `React` hoặc `Next.js`
3. Click **Create app**

## 📋 Bước 3: Lấy Credentials (30 giây)

Sau khi tạo app, vào tab **App Keys**:

```
App ID: 1234567
Key: abcdef123456789
Secret: xyz789secret123
Cluster: ap1
```

## ⚙️ Bước 4: Cập nhật .env.local (1 phút)

Mở file `.env.local` và thêm:

```env
# Pusher Configuration
NEXT_PUBLIC_PUSHER_APP_KEY=abcdef123456789
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
PUSHER_APP_ID=1234567
PUSHER_SECRET=xyz789secret123
```

**Lưu ý:** Thay các giá trị trên bằng credentials từ Pusher dashboard.

## 🚀 Bước 5: Chạy App (30 giây)

```bash
pnpm dev
```

Mở browser: http://localhost:3000

## ✅ Kiểm tra

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

🔄 Pusher state: initialized → connecting
🔄 Pusher state: connecting → connected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Pusher Connected Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Connection Info:
   Socket ID: 123456.789012
   State: connected
   Connected At: 2026-02-03T07:30:45.123Z
   Environment: Local
   Client Origin: http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Pusher subscriptions setup complete
📡 Subscribed to channel: mt5-channel
```

## 🎯 Xong!

Bây giờ app đã dùng Pusher thay vì WebSocket tự host:

- ✅ Không cần VPS WebSocket server
- ✅ Không còn reload issues
- ✅ Stable connection
- ✅ Hoạt động tốt với Vercel

## 📊 Monitor trên Pusher Dashboard

1. Truy cập: https://dashboard.pusher.com/
2. Chọn app: `mt5-trading-dashboard`
3. Tab **Debug Console**
4. Xem realtime:
   - Connections
   - Messages
   - Channels

## 🔧 Deploy lên Vercel

### 1. Thêm Environment Variables:

Vercel Dashboard → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_PUSHER_APP_KEY` | `abcdef123456789` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `ap1` |
| `PUSHER_APP_ID` | `1234567` |
| `PUSHER_SECRET` | `xyz789secret123` |

### 2. Deploy:

```bash
git add .
git commit -m "feat: Replace WebSocket with Pusher"
git push
```

Vercel sẽ tự động deploy!

## ⚠️ Troubleshooting

### Lỗi: Connection failed

**Kiểm tra:**
1. `NEXT_PUBLIC_PUSHER_APP_KEY` có đúng không?
2. `NEXT_PUBLIC_PUSHER_CLUSTER` có đúng không?
3. Pusher app có active không?

**Fix:**
- Copy lại credentials từ Pusher dashboard
- Restart dev server: `Ctrl+C` rồi `pnpm dev`

### Lỗi: No messages received

**Kiểm tra:**
1. EA Bot có đang chạy không?
2. API routes có gọi `broadcastXXX()` không?

**Fix:**
- Check Pusher Debug Console xem có messages không
- Check server logs xem có `📡 [PUSHER] Broadcasted...` không

## 📚 Tài liệu đầy đủ

- **[PUSHER_SETUP.md](./PUSHER_SETUP.md)** - Hướng dẫn chi tiết
- **Pusher Docs:** https://pusher.com/docs/

## 🎉 Hoàn thành!

Bạn đã thành công migrate từ WebSocket sang Pusher! 🚀

**Free tier limits:**
- 200,000 messages/day
- 100 concurrent connections
- Unlimited channels

Đủ dùng cho development và small production! 💪
