# Quick Production Deployment Script (PowerShell)
# Usage: .\quick-deploy.ps1

Write-Host "🚀 QUICK PRODUCTION DEPLOYMENT" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "⚠️  Creating .env.production from example..." -ForegroundColor Yellow
    Copy-Item ".env.production.example" ".env.production"
    Write-Host "❗ Please edit .env.production with your actual values!" -ForegroundColor Red
    Write-Host "Press Enter to continue after editing .env.production..."
    Read-Host
}

# Pull latest code
Write-Host "📥 Pulling latest code..." -ForegroundColor Yellow
git pull origin main

# Stop containers
Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
docker-compose down

# Build and start containers
Write-Host "🔨 Building and starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep 30

# Check backend health
Write-Host "🔍 Checking backend health..." -ForegroundColor Yellow
$healthCheck = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is healthy" -ForegroundColor Green
            $healthCheck = $true
            break
        }
    } catch {
        Write-Host "⏳ Waiting for backend... (attempt $i/5)" -ForegroundColor Yellow
        Start-Sleep 10
    }
}

if (-not $healthCheck) {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
}

# Run migrations
Write-Host "🗃️  Running database migrations..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml exec -T backend alembic upgrade head

# Show status
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:"
Write-Host "✅ Backend: http://localhost:8000"
Write-Host "✅ Frontend: http://localhost:3000"  
Write-Host "✅ API Docs: http://localhost:8000/docs"
Write-Host ""
docker-compose -f docker-compose.production.yml ps