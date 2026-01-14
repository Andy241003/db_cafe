#!/bin/bash

# Script rollback về version trước
# Sử dụng: ./rollback.sh TIMESTAMP
# Ví dụ: ./rollback.sh 20260114_151230

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Please provide backup timestamp"
  echo "Usage: ./rollback.sh TIMESTAMP"
  echo ""
  echo "Available backups:"
  ls -lt backups/ | grep "^d" | awk '{print $9}'
  exit 1
fi

TIMESTAMP=$1
BACKUP_DIR="./backups/$TIMESTAMP"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Error: Backup directory not found: $BACKUP_DIR"
  exit 1
fi

echo "========================================="
echo "🔄 ROLLBACK - Hotel Link"
echo "========================================="
echo "Rolling back to: $TIMESTAMP"
echo ""

read -p "⚠️  This will restore database and uploads. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Rollback cancelled."
  exit 1
fi

# 1. Stop current containers
echo ""
echo "🛑 Step 1: Stopping current containers..."
docker-compose -f docker-compose.production.yml down

# 2. Restore Docker images
echo ""
echo "🔄 Step 2: Restoring Docker images..."
if docker image inspect backend-htlink-backend:backup-$TIMESTAMP > /dev/null 2>&1; then
  docker tag backend-htlink-backend:backup-$TIMESTAMP backend-htlink-backend:latest
  echo "✅ Backend image restored"
else
  echo "⚠️  No backend backup image found"
fi

if docker image inspect backend-htlink-frontend:backup-$TIMESTAMP > /dev/null 2>&1; then
  docker tag backend-htlink-frontend:backup-$TIMESTAMP backend-htlink-frontend:latest
  echo "✅ Frontend image restored"
else
  echo "⚠️  No frontend backup image found"
fi

# 3. Start containers
echo ""
echo "🚀 Step 3: Starting containers..."
docker-compose -f docker-compose.production.yml up -d db
sleep 10

# 4. Restore database
echo ""
echo "📥 Step 4: Restoring database..."
if [ -f "$BACKUP_DIR/database_backup.sql" ]; then
  docker-compose -f docker-compose.production.yml exec -T db mysql \
    -u hotellink360_user \
    -pStrongDBPassword2024! \
    hotellink360_db < "$BACKUP_DIR/database_backup.sql"
  echo "✅ Database restored"
else
  echo "⚠️  No database backup found"
fi

# 5. Restore uploads
echo ""
echo "📥 Step 5: Restoring uploads..."
if [ -f "$BACKUP_DIR/uploads_backup.tar.gz" ]; then
  docker run --rm \
    -v backend-htlink_app-uploads:/data \
    -v "$(pwd)/$BACKUP_DIR":/backup \
    ubuntu tar xzf /backup/uploads_backup.tar.gz -C /data
  echo "✅ Uploads restored"
else
  echo "⚠️  No uploads backup found"
fi

# 6. Start all services
echo ""
echo "🚀 Step 6: Starting all services..."
docker-compose -f docker-compose.production.yml up -d

sleep 10

# 7. Check status
echo ""
echo "🏥 Step 7: Checking services..."
docker-compose -f docker-compose.production.yml ps

echo ""
echo "========================================="
echo "✅ ROLLBACK COMPLETED!"
echo "========================================="
echo "Restored from: $BACKUP_DIR"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.production.yml logs -f"
echo "========================================="
