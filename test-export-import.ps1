# Test Export/Import API
# PowerShell script

# Configuration
$API_BASE = "http://localhost:8000/api/v1"
$TOKEN = "YOUR_ACCESS_TOKEN_HERE"  # Replace with actual token
$PROPERTY_ID = "1"  # Replace with actual property ID

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }

Write-Info "==================================="
Write-Info "VR Hotel Export/Import API Tests"
Write-Info "==================================="

# Headers
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "X-Property-Id" = $PROPERTY_ID
    "X-Tenant-Code" = "demo"
}

# Test 1: Export Property
Write-Info "`n[TEST 1] Export Property Template"
try {
    $exportUrl = "$API_BASE/vr-hotel/export"
    Write-Info "POST $exportUrl"
    
    $response = Invoke-WebRequest -Uri $exportUrl -Method Post -Headers $headers -OutFile "property-export-test.zip"
    
    if (Test-Path "property-export-test.zip") {
        $fileSize = (Get-Item "property-export-test.zip").Length
        Write-Success "✓ Export successful! File size: $fileSize bytes"
        
        # Extract and check contents
        Expand-Archive -Path "property-export-test.zip" -DestinationPath "export-test" -Force
        
        if (Test-Path "export-test/metadata.json") {
            $metadata = Get-Content "export-test/metadata.json" | ConvertFrom-Json
            Write-Success "✓ metadata.json found"
            Write-Info "  Property: $($metadata.property.name)"
            Write-Info "  Total Rooms: $($metadata.property.total_rooms)"
            Write-Info "  Total Dining: $($metadata.property.total_dining)"
            Write-Info "  Total Services: $($metadata.property.total_services)"
            Write-Info "  Total Facilities: $($metadata.property.total_facilities)"
        }
        
        if (Test-Path "export-test/data.json") {
            $data = Get-Content "export-test/data.json" | ConvertFrom-Json
            Write-Success "✓ data.json found"
            Write-Info "  Export Version: $($data.export_version)"
            Write-Info "  Locales: $($data.locales.Count)"
            Write-Info "  Rooms: $($data.contents.rooms.Count)"
            Write-Info "  Dining: $($data.contents.dining.Count)"
            Write-Info "  Services: $($data.contents.services.Count)"
            Write-Info "  Facilities: $($data.contents.facilities.Count)"
        }
    } else {
        Write-Error "✗ Export file not created"
    }
} catch {
    Write-Error "✗ Export failed: $($_.Exception.Message)"
}

# Test 2: Preview Import
Write-Info "`n[TEST 2] Preview Import"
try {
    if (Test-Path "property-export-test.zip") {
        $previewUrl = "$API_BASE/vr-hotel/import-preview"
        Write-Info "POST $previewUrl"
        
        # Create multipart form data
        $boundary = [System.Guid]::NewGuid().ToString()
        $filePath = Resolve-Path "property-export-test.zip"
        $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
        $fileName = [System.IO.Path]::GetFileName($filePath)
        
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
            "Content-Type: application/zip",
            "",
            [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($fileBytes),
            "--$boundary--"
        ) -join "`r`n"
        
        $response = Invoke-RestMethod -Uri $previewUrl -Method Post -Headers @{
            "Authorization" = "Bearer $TOKEN"
            "X-Property-Id" = $PROPERTY_ID
            "X-Tenant-Code" = "demo"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        } -Body $bodyLines
        
        Write-Success "✓ Preview successful!"
        Write-Info "  Status: $($response.status)"
        Write-Info "  Source Property: $($response.source_property.source_property_name)"
        Write-Info "  Summary:"
        Write-Info "    - Locales: $($response.summary.locales)"
        Write-Info "    - Rooms: $($response.summary.rooms)"
        Write-Info "    - Dining: $($response.summary.dining)"
        Write-Info "    - Services: $($response.summary.services)"
        Write-Info "    - Facilities: $($response.summary.facilities)"
        Write-Info "    - Images: $($response.summary.images)"
        
        if ($response.warnings) {
            Write-Info "  Warnings:"
            foreach ($warning in $response.warnings) {
                Write-Info "    ⚠ $warning"
            }
        }
    } else {
        Write-Error "✗ No export file found for preview"
    }
} catch {
    Write-Error "✗ Preview failed: $($_.Exception.Message)"
}

# Test 3: Import (commented out by default for safety)
Write-Info "`n[TEST 3] Import Property Template"
Write-Info "⚠ Import test is commented out by default to prevent accidental data changes"
Write-Info "To enable, uncomment the import test code in the script"

<#
try {
    if (Test-Path "property-export-test.zip") {
        $importUrl = "$API_BASE/vr-hotel/import"
        Write-Info "POST $importUrl"
        
        # Same multipart form data as preview
        $boundary = [System.Guid]::NewGuid().ToString()
        $filePath = Resolve-Path "property-export-test.zip"
        $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
        $fileName = [System.IO.Path]::GetFileName($filePath)
        
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
            "Content-Type: application/zip",
            "",
            [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($fileBytes),
            "--$boundary--"
        ) -join "`r`n"
        
        $response = Invoke-RestMethod -Uri $importUrl -Method Post -Headers @{
            "Authorization" = "Bearer $TOKEN"
            "X-Property-Id" = $PROPERTY_ID
            "X-Tenant-Code" = "demo"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        } -Body $bodyLines
        
        Write-Success "✓ Import successful!"
        Write-Info "  Message: $($response.message)"
        Write-Info "  Summary:"
        Write-Info "    - Rooms imported: $($response.summary.rooms)"
        Write-Info "    - Dining imported: $($response.summary.dining)"
        Write-Info "    - Services imported: $($response.summary.services)"
        Write-Info "    - Facilities imported: $($response.summary.facilities)"
        
        if ($response.next_steps) {
            Write-Info "  Next Steps:"
            foreach ($step in $response.next_steps) {
                Write-Info "    → $step"
            }
        }
    } else {
        Write-Error "✗ No export file found for import"
    }
} catch {
    Write-Error "✗ Import failed: $($_.Exception.Message)"
}
#>

# Cleanup
Write-Info "`n[CLEANUP]"
Write-Info "Test files created:"
Write-Info "  - property-export-test.zip"
Write-Info "  - export-test/ (extracted)"
Write-Info "Run 'Remove-Item property-export-test.zip, export-test -Recurse' to clean up"

Write-Info "`n==================================="
Write-Success "Tests completed!"
Write-Info "==================================="
