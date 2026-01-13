Write-Host "=== Testing Sync Issue Fix ===" -ForegroundColor Green
Write-Host ""

Write-Host "1. Check property_locales table:" -ForegroundColor Cyan
docker exec backend-htlink-db-1 mysql -u root -p'VeryStrongRootPass2024!' hotellink360_db -e "
SELECT 
    pl.id,
    pl.property_id,
    pl.locale_code,
    l.name as locale_name,
    pl.is_active
FROM property_locales pl
LEFT JOIN locales l ON pl.locale_code = l.code
WHERE pl.property_id = 10
ORDER BY pl.locale_code;
"

Write-Host ""
Write-Host "2. Check properties.settings_json:" -ForegroundColor Cyan
docker exec backend-htlink-db-1 mysql -u root -p'VeryStrongRootPass2024!' hotellink360_db -e "
SELECT 
    id,
    property_name,
    JSON_EXTRACT(settings_json, '$.localization.supportedLanguages') as supported_langs
FROM properties 
WHERE id = 10;
"

Write-Host ""
Write-Host "3. Test API Response:" -ForegroundColor Cyan
Write-Host "   Run this in browser console after login:" -ForegroundColor Yellow
Write-Host ""
Write-Host @"
fetch('http://localhost:8000/api/v1/vr-hotel/languages', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
    'X-Tenant-Code': localStorage.getItem('tenant_code'),
    'X-Property-Id': '10'
  }
})
.then(r => r.json())
.then(data => {
  console.log('Languages count:', data.length);
  console.table(data);
});
"@ -ForegroundColor Cyan

Write-Host ""
Write-Host "Expected: Should see 3 languages (en, vi, zh)" -ForegroundColor Green
Write-Host ""
Write-Host "To test sync functionality:" -ForegroundColor Yellow
Write-Host "1. Go to http://localhost:5173/settings?tab=localization"
Write-Host "2. Add or remove a language"
Write-Host "3. Click Save"
Write-Host "4. The system will auto-sync with property_locales table"
