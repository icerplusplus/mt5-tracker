# Script to update ALLOWED_ORIGINS for development
# Run this on VPS to allow localhost:3000 connections

Write-Host "🔧 Updating ALLOWED_ORIGINS for development..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# Read current .env
$envContent = Get-Content ".env" -Raw

# Check if ALLOWED_ORIGINS already has localhost:3000
if ($envContent -match "ALLOWED_ORIGINS=.*localhost:3000") {
    Write-Host "✅ localhost:3000 already in ALLOWED_ORIGINS" -ForegroundColor Green
} else {
    Write-Host "📝 Adding localhost:3000 to ALLOWED_ORIGINS..." -ForegroundColor Yellow
    
    # Update ALLOWED_ORIGINS
    if ($envContent -match "ALLOWED_ORIGINS=(.*)") {
        $currentOrigins = $matches[1].Trim()
        $newOrigins = "http://localhost:3000,$currentOrigins"
        $envContent = $envContent -replace "ALLOWED_ORIGINS=.*", "ALLOWED_ORIGINS=$newOrigins"
        
        # Save updated .env
        $envContent | Set-Content ".env" -NoNewline
        
        Write-Host "✅ Updated ALLOWED_ORIGINS to: $newOrigins" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ALLOWED_ORIGINS not found in .env" -ForegroundColor Yellow
        Write-Host "   Please add manually:" -ForegroundColor Yellow
        Write-Host "   ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "✅ Configuration updated!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Please restart your WebSocket server:" -ForegroundColor Cyan
Write-Host "   1. Press Ctrl+C to stop current server" -ForegroundColor Yellow
Write-Host "   2. Run: node server.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Or if you want to run in background:" -ForegroundColor Cyan
Write-Host "   Start-Process -NoNewWindow node -ArgumentList 'server.js'" -ForegroundColor White
Write-Host ""
