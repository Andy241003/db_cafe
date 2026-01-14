#!/bin/bash

# Script tự động setup SSL cho travel.link360.vn
# Chạy trên server với quyền root

set -e

DOMAIN="travel.link360.vn"
EMAIL="admin@travel.link360.vn"  # Thay bằng email của bạn

echo "========================================="
echo "🔐 SSL Setup for $DOMAIN"
echo "========================================="

# 1. Kiểm tra Nginx đã cài chưa
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt update
    apt install -y nginx
else
    echo "✅ Nginx already installed"
fi

# 2. Kiểm tra Certbot đã cài chưa
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot already installed"
fi

# 3. Dừng Nginx nếu đang chạy
echo ""
echo "🛑 Stopping Nginx temporarily..."
systemctl stop nginx || true

# 4. Tạo thư mục cho certbot challenge
echo ""
echo "📁 Creating certbot directories..."
mkdir -p /var/www/certbot

# 5. Copy config file
echo ""
echo "📄 Setting up Nginx config..."
if [ ! -f "nginx-travel.link360.vn.conf" ]; then
    echo "❌ Error: nginx-travel.link360.vn.conf not found!"
    echo "Please upload the config file first."
    exit 1
fi

# Tạo config tạm thời chỉ có HTTP (để lấy SSL cert)
cat > /etc/nginx/sites-available/travel.link360.vn-temp << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name travel.link360.vn www.travel.link360.vn;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
    }
}
EOF

# Enable config
ln -sf /etc/nginx/sites-available/travel.link360.vn-temp /etc/nginx/sites-enabled/travel.link360.vn
rm -f /etc/nginx/sites-enabled/default

# 6. Khởi động Nginx
echo ""
echo "🚀 Starting Nginx..."
nginx -t
systemctl start nginx
systemctl enable nginx

# 7. Lấy SSL certificate
echo ""
echo "🔐 Obtaining SSL certificate..."
certbot certonly --nginx \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --no-eff-email

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
else
    echo "❌ Failed to obtain SSL certificate!"
    echo "Please check:"
    echo "1. Domain DNS points to this server IP"
    echo "2. Port 80 and 443 are open"
    exit 1
fi

# 8. Setup auto-renewal
echo ""
echo "⏰ Setting up auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# 9. Deploy final config with HTTPS
echo ""
echo "📄 Deploying final Nginx config with HTTPS..."
cp nginx-travel.link360.vn.conf /etc/nginx/sites-available/travel.link360.vn
ln -sf /etc/nginx/sites-available/travel.link360.vn /etc/nginx/sites-enabled/travel.link360.vn
rm -f /etc/nginx/sites-available/travel.link360.vn-temp

# 10. Test và reload Nginx
echo ""
echo "🔄 Testing and reloading Nginx..."
nginx -t
systemctl reload nginx

echo ""
echo "========================================="
echo "✅ SSL SETUP COMPLETED!"
echo "========================================="
echo ""
echo "Your site is now available at:"
echo "  🌐 https://travel.link360.vn"
echo ""
echo "SSL certificate will auto-renew."
echo "To check renewal timer:"
echo "  systemctl status certbot.timer"
echo ""
echo "To manually renew:"
echo "  certbot renew"
echo "========================================="
