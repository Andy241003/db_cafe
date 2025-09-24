#!/bin/bash
# Fix database user on production server

echo "Creating database user..."
ssh root@travel.link360.vn << 'EOF'
cd /var/www/hotel-link/backend-htlink
docker compose -f docker-compose.production.yml exec -T db mysql -u root -pVeryStrongRootPass2024! << 'SQL'
CREATE DATABASE IF NOT EXISTS hotellink360_db;
CREATE USER IF NOT EXISTS 'hotellink360_user'@'%' IDENTIFIED BY 'StrongDBPassword2024!';
GRANT ALL PRIVILEGES ON hotellink360_db.* TO 'hotellink360_user'@'%';
FLUSH PRIVILEGES;
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'hotellink360_user';
SQL
EOF