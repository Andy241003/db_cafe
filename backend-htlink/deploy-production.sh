#!/bin/bash

# Production Deployment Script for HotelLink API
# Run this script on the production server

echo "🚀 Starting HotelLink API Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_step "Updating system packages..."
apt update && apt upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    print_step "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    print_step "Docker already installed"
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    print_step "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    print_step "Docker Compose already installed"
fi

# Create project directory
PROJECT_DIR="/opt/hotel-link"
print_step "Creating project directory: $PROJECT_DIR"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clone or update repository
if [ -d ".git" ]; then
    print_step "Updating existing repository..."
    git pull origin main
else
    print_step "Cloning repository..."
    git clone https://github.com/nvdong123/hotel-link.git .
fi

# Navigate to backend directory
cd backend-htlink

# Create production environment file
print_step "Creating production environment file..."
cat > .env.production << EOF
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
EOF

print_step "Environment file created successfully"

# Create production docker-compose override
print_step "Setting up production configuration..."

# Stop existing containers
print_step "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Build and start services
print_step "Building and starting production services..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to start
print_step "Waiting for services to initialize..."
sleep 10

# Check service health
print_step "Checking service health..."
if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    print_step "✅ Services are running successfully!"
else
    print_error "❌ Some services failed to start"
    docker-compose -f docker-compose.production.yml logs
    exit 1
fi

# Setup database (run migrations)
print_step "Setting up database..."
docker-compose -f docker-compose.production.yml exec -T backend python -c "
from app.core.db import init_db
from sqlmodel import Session
from app.core.db import engine

print('Initializing database...')
with Session(engine) as session:
    init_db(session)
    session.commit()
print('Database initialized successfully!')
"

# Show service URLs
print_step "🎉 Deployment completed successfully!"
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}HotelLink API Production URLs:${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "API Backend:     http://$(curl -s ifconfig.me):8000"
echo -e "API Docs:        http://$(curl -s ifconfig.me):8000/docs"  
echo -e "Database:        http://$(curl -s ifconfig.me):3306"
echo -e "${GREEN}================================${NC}"
echo -e "Credentials:"
echo -e "Username: admin@travel.link360.vn"
echo -e "Password: admin123"
echo -e "${GREEN}================================${NC}"

# Show logs
print_step "Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=20

print_step "✅ HotelLink API is now running in production!"
print_warning "Remember to:"
print_warning "1. Configure your domain DNS to point to this server"
print_warning "2. Set up SSL/HTTPS with reverse proxy (Nginx/Traefik)"
print_warning "3. Configure firewall rules"
print_warning "4. Set up monitoring and backups"