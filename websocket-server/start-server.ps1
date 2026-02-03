# Simple script to start WebSocket server on VPS
# Run this in PowerShell on Windows VPS

Write-Host "🚀 Starting MT5 WebSocket Server..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "   Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "   ✅ Created .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "   ⚠️  Please edit .env file with your configuration:" -ForegroundColor Yellow
    Write-Host "      - ALLOWED_ORIGINS" -ForegroundColor White
    Write-Host "      - SUPABASE_URL" -ForegroundColor White
    Write-Host "      - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
    Write-Host "      - MT5_API_KEY" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter after editing .env file"
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Display configuration
Write-Host "📋 Current Configuration:" -ForegroundColor Cyan
$envContent = Get-Content ".env"
foreach ($line in $envContent) {
    if ($line -match "^(PORT|HOST|ALLOWED_ORIGINS)=(.*)") {
        Write-Host "   $line" -ForegroundColor White
    }
}
Write-Host ""

# Start server
Write-Host "🔥 Starting server..." -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

node server.js
