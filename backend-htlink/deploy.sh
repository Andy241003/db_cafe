#!/bin/bash

# Deploy script for production
echo "🚀 Deploying Hotel Link to Production..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    exit 1
fi

# Build and start services with production config
echo "🏗️ Building and starting services..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker-compose.production.yml ps

# Test health
echo "🏥 Testing application health..."
curl -f http://localhost:8000/ || echo "❌ Backend not responding"
curl -f http://localhost:3000/ || echo "❌ Frontend not responding"

echo "✅ Deployment completed!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 Backend: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"

# Show logs
echo "📋 Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=10