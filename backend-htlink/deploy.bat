@echo off
REM Deploy script for production (Windows)
echo 🚀 Deploying Hotel Link to Production...

REM Check if .env.production exists
if not exist ".env.production" (
    echo ❌ .env.production file not found!
    exit /b 1
)

REM Build and start services with production config
echo 🏗️ Building and starting services...
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak > nul

REM Check if services are running
echo 🔍 Checking service status...
docker-compose -f docker-compose.production.yml ps

echo ✅ Deployment completed!
echo 🌐 Frontend: https://travel.link360.vn
echo 🔗 Backend: https://travel.link360.vn/api
echo 📊 API Docs: https://travel.link360.vn/api/docs

pause