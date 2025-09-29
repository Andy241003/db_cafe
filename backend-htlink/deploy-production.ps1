# HotelLink API Production Deployment Script for Windows
# Run this in PowerShell as Administrator on your production server

Write-Host "🚀 Starting HotelLink API Production Deployment..." -ForegroundColor Green

# Function to print colored output
function Write-Step {
    param($Message)
    Write-Host "[STEP] $Message" -ForegroundColor Green
}

function Write-Warning-Custom {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error-Custom "Please run this script as Administrator"
    exit 1
}

# Install Docker Desktop if not installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Step "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    Write-Step "After installation, restart this script"
    exit 1
} else {
    Write-Step "Docker is installed"
}

# Create project directory
$ProjectDir = "C:\hotel-link"
Write-Step "Creating project directory: $ProjectDir"
New-Item -ItemType Directory -Force -Path $ProjectDir
Set-Location $ProjectDir

# Clone or update repository
if (Test-Path ".git") {
    Write-Step "Updating existing repository..."
    git pull origin main
} else {
    Write-Step "Cloning repository..."
    git clone https://github.com/nvdong123/hotel-link.git .
}

# Navigate to backend directory
Set-Location "backend-htlink"

# Create production environment file
Write-Step "Creating production environment file..."
$envContent = @"
# Database Configuration
MYSQL_SERVER=db
MYSQL_PORT=3306
MYSQL_USER=hotellink_user
MYSQL_PASSWORD=HotelLink2024SecurePass
MYSQL_DATABASE=hotellink_production
MYSQL_ROOT_PASSWORD=RootPass2024Secure

# Backend Configuration  
SECRET_KEY=HotelLink2024ProductionSecretKeyVerySecureAndLong123456789
FIRST_SUPERUSER=admin@travel.link360.vn
FIRST_SUPERUSER_PASSWORD=admin123
FIRST_SUPERUSER_FULL_NAME=System Administrator

# FastAPI Configuration
PROJECT_NAME=HotelLink 360 SaaS API
API_V1_STR=/api/v1
BACKEND_CORS_ORIGINS=["https://zalominiapp.vtlink.vn","https://www.zalominiapp.vtlink.vn","https://api.zalominiapp.vtlink.vn"]

# JWT Configuration
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALGORITHM=HS256

# Environment
ENVIRONMENT=production
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Step "Environment file created successfully"

# Stop existing containers
Write-Step "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Build and start services
Write-Step "Building and starting production services..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to start
Write-Step "Waiting for services to initialize..."
Start-Sleep 15

# Check service health
Write-Step "Checking service health..."
$services = docker-compose -f docker-compose.production.yml ps
if ($services -match "Up") {
    Write-Step "✅ Services are running successfully!"
} else {
    Write-Error-Custom "❌ Some services failed to start"
    docker-compose -f docker-compose.production.yml logs
    exit 1
}

# Get public IP (for Windows, we'll use a simple approach)
try {
    $publicIP = (Invoke-WebRequest -Uri "http://ifconfig.me" -UseBasicParsing).Content.Trim()
} catch {
    $publicIP = "localhost"
}

# Show service URLs
Write-Step "🎉 Deployment completed successfully!"
Write-Host "================================" -ForegroundColor Green
Write-Host "HotelLink API Production URLs:" -ForegroundColor Green  
Write-Host "================================" -ForegroundColor Green
Write-Host "API Backend:     http://${publicIP}:8000"
Write-Host "API Docs:        http://${publicIP}:8000/docs"
Write-Host "Token Helper:    http://${publicIP}:8000/token-helper"
Write-Host "Database:        http://${publicIP}:3306"
Write-Host "================================" -ForegroundColor Green
Write-Host "Credentials:"
Write-Host "Username: admin@travel.link360.vn"
Write-Host "Password: admin123"
Write-Host "================================" -ForegroundColor Green

# Show recent logs
Write-Step "Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=20

Write-Step "✅ HotelLink API is now running in production!"
Write-Warning-Custom "Remember to:"
Write-Warning-Custom "1. Configure your domain DNS to point to this server"
Write-Warning-Custom "2. Set up SSL/HTTPS with reverse proxy (IIS/Nginx)"
Write-Warning-Custom "3. Configure Windows Firewall rules"
Write-Warning-Custom "4. Set up monitoring and backups"

Write-Step "Press any key to view live logs..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
docker-compose -f docker-compose.production.yml logs -f