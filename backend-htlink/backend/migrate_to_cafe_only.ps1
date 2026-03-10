# =====================================================
# Quick Database Migration Script (PowerShell)
# =====================================================
# Run this script to migrate to Cafe-only system
# WARNING: This will DELETE all VR Hotel and Travel Link data!
# =====================================================

# Colors for output
$Yellow = "Yellow"
$Green = "Green"
$Red = "Red"

Write-Host "=====================================" -ForegroundColor $Yellow
Write-Host "    Cafe-Only Migration Script" -ForegroundColor $Yellow
Write-Host "=====================================" -ForegroundColor $Yellow
Write-Host ""

# Check if MySQL is available
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlPath) {
    Write-Host "❌ MySQL not found. Please install MySQL client." -ForegroundColor $Red
    exit 1
}

# Database configuration
$DB_NAME = "linkhotel_saas_db"
$DB_USER = "root"

Write-Host "Database: $DB_NAME" -ForegroundColor $Yellow
Write-Host ""

# Step 1: Confirm
Write-Host "⚠️  WARNING: This will DELETE all VR Hotel and Travel Link data!" -ForegroundColor $Red
Write-Host "⚠️  Make sure you have a backup before proceeding!" -ForegroundColor $Red
Write-Host ""
$BACKUP_CONFIRM = Read-Host "Do you have a database backup? (yes/no)"

if ($BACKUP_CONFIRM -ne "yes") {
    Write-Host "Please create a backup first:" -ForegroundColor $Yellow
    Write-Host "mysqldump -u root -p $DB_NAME > backup_before_cafe_only_`$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    exit 1
}

Write-Host ""
$FINAL_CONFIRM = Read-Host "Are you absolutely sure you want to continue? (yes/no)"

if ($FINAL_CONFIRM -ne "yes") {
    Write-Host "Migration cancelled." -ForegroundColor $Yellow
    exit 0
}

# Step 2: Create backup (just in case)
Write-Host ""
Write-Host "Creating automatic backup..." -ForegroundColor $Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "backup_before_cafe_only_$timestamp.sql"

# Create backup
& mysqldump -u $DB_USER -p $DB_NAME | Out-File -FilePath $BACKUP_FILE -Encoding utf8

if (Test-Path $BACKUP_FILE) {
    $fileSize = (Get-Item $BACKUP_FILE).Length / 1024
    Write-Host "✅ Backup created: $BACKUP_FILE ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor $Green
} else {
    Write-Host "❌ Backup failed! Aborting migration." -ForegroundColor $Red
    exit 1
}

# Step 3: Run migration
Write-Host ""
Write-Host "Running database migration..." -ForegroundColor $Yellow

$migrationPath = "migrations\cleanup_cafe_only.sql"
if (-not (Test-Path $migrationPath)) {
    Write-Host "❌ Migration file not found: $migrationPath" -ForegroundColor $Red
    exit 1
}

# Execute migration
Get-Content $migrationPath | & mysql -u $DB_USER -p $DB_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration completed successfully!" -ForegroundColor $Green
} else {
    Write-Host "❌ Migration failed!" -ForegroundColor $Red
    Write-Host "To rollback:" -ForegroundColor $Yellow
    Write-Host "Get-Content $BACKUP_FILE | mysql -u $DB_USER -p $DB_NAME"
    exit 1
}

# Step 4: Verify
Write-Host ""
Write-Host "Verifying migration..." -ForegroundColor $Yellow

# Check if service_access column is removed
$query = "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='admin_users' AND COLUMN_NAME='service_access';"
$HAS_SERVICE_ACCESS = & mysql -u $DB_USER -p -s -N -e $query 2>$null
if (-not $HAS_SERVICE_ACCESS) { $HAS_SERVICE_ACCESS = "0" }

if ($HAS_SERVICE_ACCESS -eq "0") {
    Write-Host "✅ service_access column removed from admin_users" -ForegroundColor $Green
} else {
    Write-Host "❌ service_access column still exists!" -ForegroundColor $Red
}

# Check if VR Hotel tables are gone
$query = "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='vr_hotel_settings';"
$HAS_VR_HOTEL = & mysql -u $DB_USER -p -s -N -e $query 2>$null
if (-not $HAS_VR_HOTEL) { $HAS_VR_HOTEL = "0" }

if ($HAS_VR_HOTEL -eq "0") {
    Write-Host "✅ VR Hotel tables removed" -ForegroundColor $Green
} else {
    Write-Host "❌ VR Hotel tables still exist!" -ForegroundColor $Red
}

# Check if Cafe tables are intact
$query = "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='cafe_settings';"
$HAS_CAFE = & mysql -u $DB_USER -p -s -N -e $query 2>$null
if (-not $HAS_CAFE) { $HAS_CAFE = "0" }

if ($HAS_CAFE -eq "1") {
    Write-Host "✅ Cafe tables intact" -ForegroundColor $Green
} else {
    Write-Host "❌ Cafe tables missing!" -ForegroundColor $Red
}

# Step 5: Show summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor $Yellow
Write-Host "Migration Summary" -ForegroundColor $Green
Write-Host "=====================================" -ForegroundColor $Yellow
Write-Host "Backup file: $BACKUP_FILE"
Write-Host "Backup size: $fileSize KB"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Restart backend: " -NoNewline
Write-Host "docker-compose restart backend" -ForegroundColor $Yellow
Write-Host "  2. Test login flow"
Write-Host "  3. Verify Cafe features work"
Write-Host ""
Write-Host "To rollback (if needed):" -ForegroundColor $Yellow
Write-Host "  Get-Content $BACKUP_FILE | mysql -u $DB_USER -p $DB_NAME"
Write-Host ""
Write-Host "✅ Migration completed!" -ForegroundColor $Green
