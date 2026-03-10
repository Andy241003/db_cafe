# Run migration: Change cafe_menu_categories icon to media reference
# Date: 2026-02-12

Write-Host "Running migration: Change cafe_menu_categories.icon to icon_media_id..." -ForegroundColor Cyan

$migrationFile = "backend/migrations/change_menu_category_icon_to_media.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "Error: Migration file not found at $migrationFile" -ForegroundColor Red
    exit 1
}

# Read migration SQL
$migrationSql = Get-Content $migrationFile -Raw

Write-Host "`nMigration SQL:" -ForegroundColor Yellow
Write-Host $migrationSql

Write-Host "`n⚠️  WARNING: This will modify the cafe_menu_categories table structure!" -ForegroundColor Yellow
Write-Host "   - Add new column: icon_media_id (INT)" -ForegroundColor Yellow
Write-Host "   - Remove old column: icon (VARCHAR)" -ForegroundColor Yellow
$confirm = Read-Host "`nDo you want to proceed? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

# Execute migration
Write-Host "`nExecuting migration..." -ForegroundColor Green

try {
    docker exec -i backend-htlink-db-1 mysql -u hotellink -photellink123! -D hotellink360_db -e $migrationSql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host "`nVerifying changes..." -ForegroundColor Cyan
        
        # Verify table structure
        docker exec -i backend-htlink-db-1 mysql -u hotellink -photellink123! -D hotellink360_db -e "DESCRIBE cafe_menu_categories;"
        
    } else {
        Write-Host "`n❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`n❌ Migration error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Migration complete! You can now use icon_media_id for category icons." -ForegroundColor Green
