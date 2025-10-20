# 🚀 Deploy Instructions - CORS Fix

## Vấn đề
- CORS headers bị duplicate (cả Nginx và FastAPI đều thêm headers)
- Error: "Access-Control-Allow-Origin header contains multiple values"

## Giải pháp
- Backend FastAPI chỉ enable CORS khi `ENVIRONMENT=local`
- Production để Nginx handle tất cả CORS headers

## Các bước deploy trên server

### 1. SSH vào server production
```bash
ssh user@travel.link360.vn
```

### 2. Pull code mới từ Git
```bash
cd /var/www/hotel-link
git pull origin main
```

### 3. Cập nhật Nginx config
```bash
# Copy config mới từ repo
sudo cp /var/www/hotel-link/backend-htlink/nginx-production.conf /etc/nginx/sites-available/travel.link360.vn

# HOẶC edit thủ công (nếu đã có certbot config):
sudo nano /etc/nginx/sites-available/travel.link360.vn
```

**Lưu ý quan trọng:** Nếu đã có SSL config từ Certbot, chỉ cần update phần `location /api/` với nội dung sau:

```nginx
location /api/ {
    # Hide CORS headers from backend to avoid duplicates
    proxy_hide_header Access-Control-Allow-Origin;
    proxy_hide_header Access-Control-Allow-Methods;
    proxy_hide_header Access-Control-Allow-Headers;
    proxy_hide_header Access-Control-Allow-Credentials;
    
    # CORS headers - support both specific domain and wildcard subdomains
    set $cors_origin "";
    if ($http_origin ~* "^https://(app\.botonblue\.com|.*\.botonblue\.com)$") {
        set $cors_origin $http_origin;
    }
    
    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept" always;
    add_header Access-Control-Allow-Credentials "true" always;
    
    # Handle preflight OPTIONS requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin $cors_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Max-Age 3600;
        add_header Content-Length 0;
        add_header Content-Type "text/plain";
        return 204;
    }
    
    proxy_pass http://127.0.0.1:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts for API requests
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### 4. Test và reload Nginx
```bash
# Kiểm tra config syntax
sudo nginx -t

# Nếu OK, reload nginx
sudo systemctl reload nginx
```

### 5. Rebuild backend container
```bash
cd /var/www/hotel-link/backend-htlink

# Stop và rebuild backend với code mới
docker-compose -f docker-compose.production.yml up -d --build backend

# Xem logs để confirm CORS đã tắt
docker-compose -f docker-compose.production.yml logs backend | grep CORS

# Bạn sẽ thấy: "🌐 CORS disabled in backend - handled by Nginx reverse proxy"
```

### 6. Kiểm tra containers đang chạy
```bash
docker-compose -f docker-compose.production.yml ps
```

### 7. Test API từ browser
Mở https://app.botonblue.com và:
- Login should work ✅
- Analytics tracking should work ✅
- No CORS errors in console ✅

## Rollback (nếu có vấn đề)

```bash
# Restore nginx config backup
sudo cp /etc/nginx/sites-available/travel.link360.vn.backup /etc/nginx/sites-available/travel.link360.vn
sudo nginx -t
sudo systemctl reload nginx

# Rollback code
cd /var/www/hotel-link
git reset --hard HEAD~1
docker-compose -f docker-compose.production.yml up -d --build backend
```

## Verify

Test CORS từ command line:
```bash
curl -X OPTIONS https://travel.link360.vn/api/v1/auth/login \
  -H "Origin: https://app.botonblue.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Expected response headers:
```
< access-control-allow-origin: https://app.botonblue.com
< access-control-allow-methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
< access-control-allow-credentials: true
```

## Tóm tắt thay đổi

### File đã sửa:
1. **backend/app/main.py** - Tắt CORS middleware khi production
2. **nginx-production.conf** - Thêm CORS headers với wildcard support

### Logic mới:
- **Local dev**: FastAPI handle CORS (dễ dev)
- **Production**: Nginx handle CORS (tránh duplicate, hỗ trợ wildcard)
