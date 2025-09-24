#!/bin/bash

# Production Deployment Script for Hotel Link 360 SaaS
# Usage: ./deploy-production.sh

set -e

echo "🚀 HOTEL LINK 360 - PRODUCTION DEPLOYMENT"
echo "========================================="

# Configuration
DOMAIN="travel.link360.vn"
PROJECT_NAME="hotellink360"
DEPLOY_DIR="/opt/hotellink360"
BACKUP_DIR="/opt/hotellink360/backups"
CURRENT_DATE=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root for security reasons."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
fi

log_info "Starting production deployment..."

# Create deployment directory
log_info "Creating deployment directory..."
sudo mkdir -p "$DEPLOY_DIR"
sudo mkdir -p "$BACKUP_DIR"
sudo chown -R $USER:$USER "$DEPLOY_DIR"

# Clone or update repository
if [ -d "$DEPLOY_DIR/.git" ]; then
    log_info "Updating existing repository..."
    cd "$DEPLOY_DIR"
    git pull origin main
else
    log_info "Cloning repository..."
    git clone https://github.com/nvdong123/hotel-link.git "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# Backup current database if exists
log_info "Creating database backup..."
if docker ps -q -f name=${PROJECT_NAME}_db_1 > /dev/null; then
    docker exec ${PROJECT_NAME}_db_1 mysqldump -u root -p$MYSQL_ROOT_PASSWORD hotellink360_db > "${BACKUP_DIR}/db_backup_${CURRENT_DATE}.sql"
    log_success "Database backup created: ${BACKUP_DIR}/db_backup_${CURRENT_DATE}.sql"
fi

# Navigate to backend directory
cd "$DEPLOY_DIR/backend-htlink"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    log_error ".env.production file not found. Please create it first."
fi

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down || true

# Remove old images (optional, saves disk space)
log_warning "Removing old Docker images..."
docker image prune -f || true

# Build and start new containers
log_info "Building and starting containers..."
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 30

# Check if backend is accessible
log_info "Checking backend health..."
for i in {1..10}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
        break
    else
        log_warning "Backend not ready, waiting... (attempt $i/10)"
        sleep 10
    fi
done

# Check if frontend is accessible
log_info "Checking frontend health..."
for i in {1..10}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is healthy"
        break
    else
        log_warning "Frontend not ready, waiting... (attempt $i/10)"
        sleep 10
    fi
done

# Run database migrations
log_info "Running database migrations..."
docker-compose -f docker-compose.production.yml exec backend alembic upgrade head

# Create initial data if needed
log_info "Creating initial data..."
docker-compose -f docker-compose.production.yml exec backend python app/initial_data.py

# Show running containers
log_info "Current running containers:"
docker-compose -f docker-compose.production.yml ps

# Display final status
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo "✅ Backend: http://localhost:8000"
echo "✅ Frontend: http://localhost:3000"
echo "✅ API Docs: http://localhost:8000/docs"
echo "✅ Database: localhost:3306"
echo ""
echo "📝 Next Steps:"
echo "1. Configure your reverse proxy (Nginx/Apache)"
echo "2. Set up SSL certificates (Let's Encrypt)"
echo "3. Configure domain DNS records"
echo "4. Set up monitoring and logging"
echo ""
echo "🔧 Management Commands:"
echo "- View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "- Restart: docker-compose -f docker-compose.production.yml restart"
echo "- Stop: docker-compose -f docker-compose.production.yml down"
echo ""

log_success "Production deployment completed successfully!"