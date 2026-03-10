#!/bin/bash

# =====================================================
# Quick Database Migration Script
# =====================================================
# Run this script to migrate to Cafe-only system
# WARNING: This will DELETE all VR Hotel and Travel Link data!
# =====================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=====================================${NC}"
echo -e "${YELLOW}    Cafe-Only Migration Script${NC}"
echo -e "${YELLOW}=====================================${NC}"
echo ""

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL not found. Please install MySQL client.${NC}"
    exit 1
fi

# Database configuration
DB_NAME="linkhotel_saas_db"
DB_USER="root"

echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo ""

# Step 1: Confirm
echo -e "${RED}⚠️  WARNING: This will DELETE all VR Hotel and Travel Link data!${NC}"
echo -e "${RED}⚠️  Make sure you have a backup before proceeding!${NC}"
echo ""
read -p "Do you have a database backup? (yes/no): " BACKUP_CONFIRM

if [ "$BACKUP_CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Please create a backup first:${NC}"
    echo "mysqldump -u root -p ${DB_NAME} > backup_before_cafe_only_\$(date +%Y%m%d_%H%M%S).sql"
    exit 1
fi

echo ""
read -p "Are you absolutely sure you want to continue? (yes/no): " FINAL_CONFIRM

if [ "$FINAL_CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Migration cancelled.${NC}"
    exit 0
fi

# Step 2: Create backup (just in case)
echo ""
echo -e "${YELLOW}Creating automatic backup...${NC}"
BACKUP_FILE="backup_before_cafe_only_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -u ${DB_USER} -p ${DB_NAME} > ${BACKUP_FILE}

if [ -f "${BACKUP_FILE}" ]; then
    echo -e "${GREEN}✅ Backup created: ${BACKUP_FILE}${NC}"
else
    echo -e "${RED}❌ Backup failed! Aborting migration.${NC}"
    exit 1
fi

# Step 3: Run migration
echo ""
echo -e "${YELLOW}Running database migration...${NC}"

mysql -u ${DB_USER} -p ${DB_NAME} < migrations/cleanup_cafe_only.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
else
    echo -e "${RED}❌ Migration failed!${NC}"
    echo -e "${YELLOW}To rollback:${NC}"
    echo "mysql -u ${DB_USER} -p ${DB_NAME} < ${BACKUP_FILE}"
    exit 1
fi

# Step 4: Verify
echo ""
echo -e "${YELLOW}Verifying migration...${NC}"

# Check if service_access column is removed
HAS_SERVICE_ACCESS=$(mysql -u ${DB_USER} -p -s -N -e "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${DB_NAME}' AND TABLE_NAME='admin_users' AND COLUMN_NAME='service_access';" 2>/dev/null || echo "0")

if [ "$HAS_SERVICE_ACCESS" = "0" ]; then
    echo -e "${GREEN}✅ service_access column removed from admin_users${NC}"
else
    echo -e "${RED}❌ service_access column still exists!${NC}"
fi

# Check if VR Hotel tables are gone
HAS_VR_HOTEL=$(mysql -u ${DB_USER} -p -s -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${DB_NAME}' AND TABLE_NAME='vr_hotel_settings';" 2>/dev/null || echo "0")

if [ "$HAS_VR_HOTEL" = "0" ]; then
    echo -e "${GREEN}✅ VR Hotel tables removed${NC}"
else
    echo -e "${RED}❌ VR Hotel tables still exist!${NC}"
fi

# Check if Cafe tables are intact
HAS_CAFE=$(mysql -u ${DB_USER} -p -s -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${DB_NAME}' AND TABLE_NAME='cafe_settings';" 2>/dev/null || echo "0")

if [ "$HAS_CAFE" = "1" ]; then
    echo -e "${GREEN}✅ Cafe tables intact${NC}"
else
    echo -e "${RED}❌ Cafe tables missing!${NC}"
fi

# Step 5: Show summary
echo ""
echo -e "${YELLOW}=====================================${NC}"
echo -e "${GREEN}Migration Summary${NC}"
echo -e "${YELLOW}=====================================${NC}"
echo -e "Backup file: ${BACKUP_FILE}"
echo -e "Next steps:"
echo -e "  1. Restart backend: ${YELLOW}docker-compose restart backend${NC}"
echo -e "  2. Test login flow"
echo -e "  3. Verify Cafe features work"
echo ""
echo -e "${YELLOW}To rollback (if needed):${NC}"
echo -e "  mysql -u ${DB_USER} -p ${DB_NAME} < ${BACKUP_FILE}"
echo ""
echo -e "${GREEN}✅ Migration completed!${NC}"
