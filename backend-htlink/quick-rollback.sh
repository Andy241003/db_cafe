#!/bin/bash

# Script rollback nhanh (chỉ stop và start lại containers cũ)
# Sử dụng khi build mới bị lỗi nhưng chưa down containers

set -e

echo "========================================="
echo "⚡ QUICK ROLLBACK - Hotel Link"
echo "========================================="

echo ""
echo "🛑 Stopping new containers..."
docker-compose -f docker-compose.production.yml down

echo ""
echo "🔄 Restoring previous images..."
LATEST_BACKUP=$(ls -t backups/ | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ No backup found!"
  exit 1
fi

echo "Found backup: $LATEST_BACKUP"

# Restore images
if docker image inspect backend-htlink-backend:backup-$LATEST_BACKUP > /dev/null 2>&1; then
  docker tag backend-htlink-backend:backup-$LATEST_BACKUP backend-htlink-backend:latest
  echo "✅ Backend image restored"
fi

if docker image inspect backend-htlink-frontend:backup-$LATEST_BACKUP > /dev/null 2>&1; then
  docker tag backend-htlink-frontend:backup-$LATEST_BACKUP backend-htlink-frontend:latest
  echo "✅ Frontend image restored"
fi

echo ""
echo "🚀 Starting previous version..."
docker-compose -f docker-compose.production.yml up -d

sleep 10

echo ""
echo "🏥 Checking services..."
docker-compose -f docker-compose.production.yml ps

echo ""
echo "========================================="
echo "✅ QUICK ROLLBACK COMPLETED!"
echo "========================================="
