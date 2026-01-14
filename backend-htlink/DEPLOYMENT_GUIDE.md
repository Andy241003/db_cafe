# 🚀 Hướng dẫn Deploy với Domain và SSL

## Bước 1: Cấu hình DNS

Trỏ domain `travel.link360.vn` về IP server của bạn:

```
A Record:  travel.link360.vn  →  157.10.199.166
A Record:  www.travel.link360.vn  →  157.10.199.166
```

Kiểm tra DNS đã trỏ đúng:
```bash
nslookup travel.link360.vn
ping travel.link360.vn
```

## Bước 2: Upload files lên server

```bash
# Từ máy local
scp nginx-travel.link360.vn.conf setup-ssl.sh root@157.10.199.166:/var/www/hotel-link/backend-htlink/
```

## Bước 3: Chạy script setup SSL

Trên server:

```bash
cd /var/www/hotel-link/backend-htlink

# Cho phép thực thi
chmod +x setup-ssl.sh

# Chỉnh sửa email trong script (nếu cần)
nano setup-ssl.sh

# Chạy script
sudo ./setup-ssl.sh
```

Script sẽ tự động:
- ✅ Cài đặt Nginx (nếu chưa có)
- ✅ Cài đặt Certbot
- ✅ Lấy SSL certificate từ Let's Encrypt (miễn phí)
- ✅ Cấu hình Nginx reverse proxy
- ✅ Setup auto-renewal cho SSL

## Bước 4: Kiểm tra

```bash
# Kiểm tra Nginx config
sudo nginx -t

# Xem status
sudo systemctl status nginx

# Xem logs
sudo tail -f /var/log/nginx/travel.link360.vn-access.log
sudo tail -f /var/log/nginx/travel.link360.vn-error.log
```

## Bước 5: Truy cập website

- Frontend: https://travel.link360.vn
- Backend API: https://travel.link360.vn/api/v1/docs

## Troubleshooting

### Nếu SSL không lấy được:

1. **Kiểm tra DNS:**
   ```bash
   nslookup travel.link360.vn
   ```

2. **Kiểm tra firewall:**
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw status
   ```

3. **Kiểm tra port đang mở:**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   ```

4. **Xem logs lỗi:**
   ```bash
   sudo tail -f /var/log/letsencrypt/letsencrypt.log
   ```

### Setup SSL thủ công (nếu script lỗi):

```bash
# 1. Cài Nginx và Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Lấy SSL certificate
sudo certbot --nginx -d travel.link360.vn -d www.travel.link360.vn

# 3. Copy config
sudo cp nginx-travel.link360.vn.conf /etc/nginx/sites-available/travel.link360.vn
sudo ln -s /etc/nginx/sites-available/travel.link360.vn /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 4. Test và reload
sudo nginx -t
sudo systemctl reload nginx
```

## Renew SSL Certificate

SSL sẽ tự động renew. Để kiểm tra:

```bash
# Xem trạng thái auto-renewal
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run

# Renew thủ công
sudo certbot renew
```

## Các lệnh hữu ích

```bash
# Reload Nginx sau khi sửa config
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Xem logs realtime
sudo tail -f /var/log/nginx/travel.link360.vn-access.log

# Kiểm tra SSL certificate info
sudo certbot certificates
```

## Cấu trúc sau khi setup

```
Frontend:  https://travel.link360.vn/
Backend:   https://travel.link360.vn/api/
Uploads:   https://travel.link360.vn/uploads/

Nginx → Reverse Proxy → Docker Containers
  ↓
  - Frontend (port 5173)
  - Backend (port 8000)
```
