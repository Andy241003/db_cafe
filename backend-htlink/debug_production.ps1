# PowerShell script to debug production server
# Server IP: 157.10.199.166

$SERVER_IP = "157.10.199.166"
$API_BASE = "http://$SERVER_IP:8000"

Write-Host "🔍 Hotel Link Production Debug" -ForegroundColor Cyan
Write-Host "Server: $SERVER_IP" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Function to test endpoint
function Test-Endpoint {
    param($Url, $Description)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10
        Write-Host "✅ $Description - Status: $($response.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $Description - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test POST endpoint
function Test-PostEndpoint {
    param($Url, $Body, $Description)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method POST -ContentType "application/x-www-form-urlencoded" -Body $Body -TimeoutSec 10
        Write-Host "✅ $Description - Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "❌ $Description - Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
        }
        return $false
    }
}

Write-Host "`n📋 Step 1: Testing basic connectivity..." -ForegroundColor Yellow

# Test health endpoint
Test-Endpoint "$API_BASE/health" "Health Check"

# Test root endpoint  
Test-Endpoint "$API_BASE/" "Root Endpoint"

# Test API docs
Test-Endpoint "$API_BASE/api/v1/docs" "API Documentation"

# Test OpenAPI JSON
Test-Endpoint "$API_BASE/api/v1/openapi.json" "OpenAPI Specification"

Write-Host "`n📋 Step 2: Testing authentication..." -ForegroundColor Yellow

# Test login
$loginBody = "username=admin@travel.link360.vn" + "&password=SuperSecretPass123"
Test-PostEndpoint "$API_BASE/api/v1/auth/access-token" $loginBody "Authentication Login"

Write-Host "`n📋 Step 3: Testing with different tenant..." -ForegroundColor Yellow

# Test with tenant header
try {
    $headers = @{"X-Tenant-Code" = "demo"}
    $response = Invoke-WebRequest -Uri "$API_BASE/api/v1/auth/access-token" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $loginBody -Headers $headers -TimeoutSec 10
    Write-Host "✅ Authentication with Tenant Header - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication with Tenant Header - Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 Detailed Error Analysis..." -ForegroundColor Cyan

# Get detailed error response
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/api/v1/auth/access-token" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $loginBody
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response Body: $errorBody" -ForegroundColor Red
        $reader.Close()
    }
}

Write-Host "`n🛠️  RECOMMENDED ACTIONS:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "1. SSH into server: ssh root@$SERVER_IP"
Write-Host "2. Check container logs:"
Write-Host "   docker-compose -f docker-compose.production.yml logs backend --tail=50"
Write-Host "3. Check database logs:"
Write-Host "   docker-compose -f docker-compose.production.yml logs db --tail=20"
Write-Host "4. Run debug script on server:"
Write-Host "   docker-compose -f docker-compose.production.yml exec backend python debug_production.py"
Write-Host "5. Check environment variables:"
Write-Host "   docker-compose -f docker-compose.production.yml exec backend env | grep -E '(MYSQL|FIRST_SUPERUSER)'"

Write-Host "`n📞 Quick SSH commands to run:" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "# Check if containers are running:"
Write-Host "ssh root@$SERVER_IP 'cd /path/to/project && docker-compose -f docker-compose.production.yml ps'"
Write-Host ""
Write-Host "# Get backend logs:"
Write-Host "ssh root@$SERVER_IP 'docker logs \`$(docker ps -q --filter ancestor=backend-htlink-backend)\`'"
Write-Host ""
Write-Host "# Restart backend:"
Write-Host "ssh root@$SERVER_IP 'cd /path/to/project && docker-compose -f docker-compose.production.yml restart backend'"

Write-Host "`n✅ Debug completed!" -ForegroundColor Green