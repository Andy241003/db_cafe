#!/bin/bash

# Quick Production Deployment Script
# Usage: ./quick-deploy.sh

echo "🚀 QUICK PRODUCTION DEPLOYMENT"
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.production from example...${NC}"
    cp .env.production.example .env.production
    echo -e "${RED}❗ Please edit .env.production with your actual values before continuing!${NC}"
    echo "Press Enter to continue after editing .env.production..."
    read
fi

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main

# Stop containers
echo -e "${YELLOW}🛑 Stopping containers...${NC}"
docker-compose down

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Check backend health
echo -e "${YELLOW}🔍 Checking backend health...${NC}"
for i in {1..5}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy (port 8000)${NC}"
        break
    else
        echo -e "${YELLOW}⏳ Waiting for backend... (attempt $i/5)${NC}"
        sleep 10
    fi
done

# Run migrations
echo -e "${YELLOW}🗃️  Running database migrations...${NC}"
docker-compose -f docker-compose.production.yml exec -T backend alembic upgrade head

# Show status
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Services (via Nginx reverse proxy):"
echo "✅ Website: https://travel.link360.vn"
echo "✅ Dashboard: https://travel.link360.vn/dashboard/"
echo "✅ API: https://travel.link360.vn/api/"
echo "✅ API Docs: https://travel.link360.vn/api/docs"
echo "✅ Adminer: https://travel.link360.vn/adminer/"
echo ""
echo "Direct access (for debugging):"
echo "- Backend: http://localhost:8000"
echo "- Frontend: http://localhost:3001"
echo ""
docker-compose -f docker-compose.production.yml ps