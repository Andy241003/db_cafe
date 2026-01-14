#!/bin/bash

# Script deploy an toàn với backup
# Sử dụng: ./deploy-with-backup.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$TIMESTAMP"

echo "========================================="
echo "🚀 DEPLOY WITH BACKUP - Hotel Link"
echo "========================================="

# Tạo thư mục backup
mkdir -p "$BACKUP_DIR"

# 1. Backup database
echo ""
echo "📦 Step 1: Backing up database..."
docker-compose -f docker-compose.production.yml exec -T db mysqldump \
  -u hotellink360_user \
  -pStrongDBPassword2024! \
  hotellink360_db > "$BACKUP_DIR/database_backup.sql"

if [ $? -eq 0 ]; then
  echo "✅ Database backup saved to: $BACKUP_DIR/database_backup.sql"
else
  echo "❌ Database backup failed!"
  exit 1
fi

# 2. Backup volumes (uploads)
echo ""
echo "📦 Step 2: Backing up uploads..."
docker run --rm \
  -v backend-htlink_app-uploads:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  ubuntu tar czf /backup/uploads_backup.tar.gz -C /data .

if [ $? -eq 0 ]; then
  echo "✅ Uploads backup saved to: $BACKUP_DIR/uploads_backup.tar.gz"
else
  echo "⚠️  Warning: Uploads backup failed (might not exist yet)"
fi

# 3. Backup current Docker images
echo ""
echo "📦 Step 3: Tagging current images as backup..."
docker tag backend-htlink-backend:latest backend-htlink-backend:backup-$TIMESTAMP || echo "No backend image to backup"
docker tag backend-htlink-frontend:latest backend-htlink-frontend:backup-$TIMESTAMP || echo "No frontend image to backup"

# 4. Build new images
echo ""
echo "🔨 Step 4: Building new images..."
docker-compose -f docker-compose.production.yml build

if [ $? -ne 0 ]; then
  echo "❌ Build failed! Stopping deployment."
  exit 1
fi

# 5. Stop current containers
echo ""
echo "🛑 Step 5: Stopping current containers..."
docker-compose -f docker-compose.production.yml down

# 6. Start new containers
echo ""
echo "🚀 Step 6: Starting new containers..."
docker-compose -f docker-compose.production.yml up -d

# 7. Wait for services to be ready
echo ""
echo "⏳ Step 7: Waiting for services to be ready..."
sleep 10

# 8. Check health
echo ""
echo "🏥 Step 8: Checking service health..."
docker-compose -f docker-compose.production.yml ps

# 9. Test backend API
echo ""
echo "🧪 Step 9: Testing backend API..."
if curl -f http://localhost:8000/docs > /dev/null 2>&1; then
  echo "✅ Backend is responding!"
else
  echo "⚠️  Warning: Backend may not be ready yet"
fi

echo ""
echo "========================================="
echo "✅ DEPLOYMENT COMPLETED!"
echo "========================================="
echo "Backup location: $BACKUP_DIR"
echo ""
echo "To rollback, run:"
echo "  ./rollback.sh $TIMESTAMP"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.production.yml logs -f"
echo "========================================="
