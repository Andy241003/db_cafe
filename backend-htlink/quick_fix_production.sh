#!/bin/bash
# Quick Production Fix Script

echo "🔧 Quick Production Fix for Hotel Link"
echo "====================================="

# Ensure we're using production compose file
COMPOSE_FILE="docker-compose.production.yml"

echo "Step 1: Stopping all services..."
docker-compose -f $COMPOSE_FILE down

echo "Step 2: Rebuilding backend with fixed dependencies..."
docker-compose -f $COMPOSE_FILE build --no-cache backend

echo "Step 3: Starting services..."
docker-compose -f $COMPOSE_FILE up -d

echo "Step 4: Waiting for services to be ready..."
sleep 30

echo "Step 5: Running prestart script..."
docker-compose -f $COMPOSE_FILE run --rm prestart

echo "Step 6: Testing authentication..."
curl -X POST "https://travel.link360.vn/api/v1/auth/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@travel.link360.vn&password=SuperSecretPass123"

echo
echo "✅ Fix completed! Check the curl response above."