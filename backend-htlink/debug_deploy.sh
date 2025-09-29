#!/bin/bash
# Production Debug & Deploy Script

echo "🚀 Hotel Link Production Debug & Deploy"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if running in production environment
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Running in PRODUCTION environment"
    COMPOSE_FILE="docker-compose.production.yml"
else
    print_warning "Running in LOCAL environment"
    COMPOSE_FILE="docker-compose.yml"
fi

echo
echo "📋 Step 1: Checking current containers..."
docker-compose -f $COMPOSE_FILE ps

echo
echo "📋 Step 2: Checking backend logs (last 50 lines)..."
docker-compose -f $COMPOSE_FILE logs --tail=50 backend

echo
echo "📋 Step 3: Running production debug script..."
docker-compose -f $COMPOSE_FILE exec backend python debug_production.py

echo
echo "📋 Step 4: Testing health endpoint..."
if [ "$ENVIRONMENT" = "production" ]; then
    curl -s "https://travel.link360.vn/api/v1/docs" > /dev/null
    if [ $? -eq 0 ]; then
        print_status "API docs accessible"
    else
        print_error "API docs not accessible"
    fi
else
    curl -s "http://localhost:8000/health" > /dev/null
    if [ $? -eq 0 ]; then
        print_status "Health endpoint OK"
    else
        print_error "Health endpoint failed"
    fi
fi

echo
echo "📋 Step 5: Testing authentication..."
if [ "$ENVIRONMENT" = "production" ]; then
    AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
        "https://travel.link360.vn/api/v1/auth/access-token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=admin@travel.link360.vn&password=SuperSecretPass123")
    
    HTTP_CODE="${AUTH_RESPONSE: -3}"
    if [ "$HTTP_CODE" = "200" ]; then
        print_status "Production authentication working"
    else
        print_error "Production authentication failed (HTTP $HTTP_CODE)"
        echo "Response: ${AUTH_RESPONSE%???}"
    fi
else
    AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
        "http://localhost:8000/api/v1/auth/access-token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=admin@travel.link360.vn&password=SuperSecretPass123")
    
    HTTP_CODE="${AUTH_RESPONSE: -3}"
    if [ "$HTTP_CODE" = "200" ]; then
        print_status "Local authentication working"
    else
        print_error "Local authentication failed (HTTP $HTTP_CODE)"
    fi
fi

echo
echo "🎯 RECOMMENDATIONS:"
echo "=================="

if [ "$ENVIRONMENT" = "production" ]; then
    echo "For production issues:"
    echo "1. Check database connectivity and data"
    echo "2. Verify environment variables are loaded correctly"
    echo "3. Check bcrypt/passlib versions compatibility"
    echo "4. Review nginx/proxy configuration"
    echo "5. Check SSL certificates"
else
    echo "For local development:"
    echo "1. Rebuild containers if needed: docker-compose build --no-cache"
    echo "2. Reset database: docker-compose down -v && docker-compose up -d"
    echo "3. Check environment variables in .env file"
fi

echo
echo "📞 Need help? Check these logs:"
echo "- Backend: docker-compose -f $COMPOSE_FILE logs backend"
echo "- Database: docker-compose -f $COMPOSE_FILE logs db"
echo "- All services: docker-compose -f $COMPOSE_FILE logs"