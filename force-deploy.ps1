# Force Deploy to GitHub Script
# WARNING: This will overwrite remote repository with local changes

Write-Host "⚠️  FORCE DEPLOY TO GITHUB" -ForegroundColor Red
Write-Host "This will overwrite remote repository!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Are you sure? Type 'YES' to continue"
if ($confirmation -ne 'YES') {
    Write-Host "❌ Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Force deploying to GitHub..." -ForegroundColor Green
Write-Host ""

# Add all changes
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .

# Show status
Write-Host ""
Write-Host "📊 Changes to commit:" -ForegroundColor Yellow
git status --short

# Commit
Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "feat: Add standalone WebSocket server for VPS deployment

- Created websocket-server/ project for VPS deployment
- Added Windows-specific deployment guides (DEPLOYMENT_WINDOWS.md)
- Added quick start guide (WINDOWS_QUICKSTART.md)
- Fixed realtime chart updates (tick-based candle updates)
- Fixed component reload issues (useCallback memoization)
- Removed Supabase Realtime polling (use WebSocket only)
- Added comprehensive documentation and guides

New Features:
- Standalone WebSocket server for VPS
- Windows firewall configuration guide
- PM2 and Windows Service setup
- Health check endpoint
- CORS configuration
- Production-ready deployment

Fixes:
- Realtime candle updates every 1s
- Component reload prevention
- Polling elimination (50% API call reduction)
- Chart performance optimization

Documentation:
- WEBSOCKET_SERVER_SETUP.md - Complete overview
- DEPLOYMENT_WINDOWS.md - Windows deployment
- WINDOWS_QUICKSTART.md - 5-minute setup
- INTEGRATION.md - API integration guide
- Multiple fix documentation files"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ℹ️  Nothing to commit or commit failed. Continuing with push..." -ForegroundColor Yellow
}

# Force push to GitHub
Write-Host ""
Write-Host "🚀 Force pushing to GitHub..." -ForegroundColor Red
git push origin main --force

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to push." -ForegroundColor Red
    Write-Host ""
    Write-Host "Try these commands manually:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor Cyan
    Write-Host "  git commit -m 'feat: WebSocket server for VPS'" -ForegroundColor Cyan
    Write-Host "  git push origin main --force" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "✅ Successfully force deployed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Repository: https://github.com/icerplusplus/mt5-tracker" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "  1. SSH/RDP to Windows VPS (103.179.172.89)" -ForegroundColor White
Write-Host "  2. Pull latest code: git pull origin main" -ForegroundColor White
Write-Host "  3. Deploy websocket-server (see WINDOWS_QUICKSTART.md)" -ForegroundColor White
Write-Host "  4. Update NEXT_PUBLIC_WS_URL in Vercel" -ForegroundColor White
Write-Host "  5. Deploy Next.js app to Vercel" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "  - websocket-server/WINDOWS_QUICKSTART.md" -ForegroundColor Cyan
Write-Host "  - websocket-server/DEPLOYMENT_WINDOWS.md" -ForegroundColor Cyan
Write-Host "  - WEBSOCKET_SERVER_SETUP.md" -ForegroundColor Cyan
Write-Host ""
