#!/bin/bash
# Remote Production Debug Script for Hotel Link
# Server IP: 157.10.199.166

SERVER_IP="157.10.199.166"
SSH_USER="root"  # Thay đổi nếu cần
PROJECT_PATH="/var/www/hotel-link/backend-htlink"  # Điều chỉnh đường dẫn

echo "🔍 Remote Production Debug for Hotel Link"
echo "Server: $SERVER_IP"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo "📋 Step 1: Testing server connectivity..."
if curl -s "http://$SERVER_IP:8000/health" > /dev/null; then
    print_status "Server is reachable"
else
    print_error "Server is not reachable"
    exit 1
fi

echo
echo "📋 Step 2: Testing authentication endpoint..."
AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    "http://$SERVER_IP:8000/api/v1/auth/access-token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin@travel.link360.vn&password=SuperSecretPass123")

HTTP_CODE="${AUTH_RESPONSE: -3}"
RESPONSE_BODY="${AUTH_RESPONSE%???}"

echo "HTTP Status Code: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    print_status "Authentication working!"
    echo "Response: $RESPONSE_BODY"
else
    print_error "Authentication failed!"
    echo "Response: $RESPONSE_BODY"
fi

echo
echo "📋 Step 3: Testing other endpoints..."

# Test docs
if curl -s "http://$SERVER_IP:8000/api/v1/docs" > /dev/null; then
    print_status "API docs accessible"
else
    print_error "API docs not accessible"
fi

# Test OpenAPI
if curl -s "http://$SERVER_IP:8000/api/v1/openapi.json" > /dev/null; then
    print_status "OpenAPI JSON accessible"
else
    print_error "OpenAPI JSON not accessible"
fi

echo
echo "🔧 DEBUGGING COMMANDS FOR SERVER:"
echo "================================="
echo "# SSH into server:"
echo "ssh $SSH_USER@$SERVER_IP"
echo
echo "# Check containers:"
echo "docker-compose -f docker-compose.production.yml ps"
echo
echo "# Check backend logs:"
echo "docker-compose -f docker-compose.production.yml logs backend --tail=100"
echo
echo "# Check database logs:"
echo "docker-compose -f docker-compose.production.yml logs db --tail=50"
echo
echo "# Copy debug script:"
echo "docker cp debug_production.py \$(docker-compose -f docker-compose.production.yml ps -q backend):/app/"
echo
echo "# Run debug script:"
echo "docker-compose -f docker-compose.production.yml exec backend python debug_production.py"
echo
echo "# Restart services:"
echo "docker-compose -f docker-compose.production.yml down"
echo "docker-compose -f docker-compose.production.yml up -d"

echo
echo "📞 QUICK SSH COMMANDS:"
echo "====================="
cat << 'EOF'
# Quick diagnosis on server:
ssh root@157.10.199.166 "cd /var/www/hotel-link/backend-htlink && docker-compose -f docker-compose.production.yml logs backend --tail=20"

# Check environment variables:
ssh root@157.10.199.166 "cd /var/www/hotel-link/backend-htlink && docker-compose -f docker-compose.production.yml exec backend env | grep -E '(MYSQL|FIRST_SUPERUSER|SECRET_KEY)'"

# Restart backend only:
ssh root@157.10.199.166 "cd /var/www/hotel-link/backend-htlink && docker-compose -f docker-compose.production.yml restart backend"
EOF