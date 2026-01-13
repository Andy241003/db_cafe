# Test VR Hotel Languages API after migration

Write-Host "=== Testing VR Hotel Languages API ===" -ForegroundColor Green
Write-Host ""

# Get token first (you need to login manually and paste token here)
$token = "YOUR_TOKEN_HERE"  # Replace with actual token from browser

# Test 1: Get Languages
Write-Host "Test 1: GET /api/v1/vr-hotel/languages" -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $token"
    "X-Property-Id" = "10"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/vr-hotel/languages" `
        -Method GET `
        -Headers $headers
    Write-Host "✅ Success! Found $($response.Count) languages:" -ForegroundColor Green
    $response | Format-Table -AutoSize
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode
}

Write-Host ""
Write-Host "Test 2: ADD new language (ja - Japanese)" -ForegroundColor Cyan

$body = @{
    locale_code = "ja"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/vr-hotel/languages" `
        -Method POST `
        -Headers $headers `
        -Body $body
    Write-Host "✅ Success! Added Japanese:" -ForegroundColor Green
    $response | Format-Table -AutoSize
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test 3: Verify database directly" -ForegroundColor Cyan

docker exec backend-htlink-db-1 mysql -u root -p'VeryStrongRootPass2024!' hotellink360_db -e "
SELECT 
    pl.id,
    pl.property_id,
    pl.locale_code,
    l.name as locale_name,
    pl.is_default,
    pl.is_active
FROM property_locales pl
LEFT JOIN locales l ON pl.locale_code = l.code
WHERE pl.property_id = 10
ORDER BY pl.is_default DESC, pl.locale_code;
"

Write-Host ""
Write-Host "Test 4: Check old vr_languages table (should not exist)" -ForegroundColor Cyan

$result = docker exec backend-htlink-db-1 mysql -u root -p'VeryStrongRootPass2024!' hotellink360_db -e "
SELECT COUNT(*) as count FROM information_schema.tables 
WHERE table_schema = 'hotellink360_db' AND table_name = 'vr_languages';
" 2>&1 | Select-String "count"

if ($result -match "0") {
    Write-Host "✅ vr_languages table has been successfully removed!" -ForegroundColor Green
} else {
    Write-Host "⚠️  vr_languages table still exists!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Migration Test Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Manual steps to get token:" -ForegroundColor Yellow
Write-Host "1. Go to http://localhost:5173"
Write-Host "2. Login with fusion@admin.com"
Write-Host "3. Open DevTools > Application > Local Storage"
Write-Host "4. Copy 'token' value"
Write-Host "5. Paste into this script at line 6"
