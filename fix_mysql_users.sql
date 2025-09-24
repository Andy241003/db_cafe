CREATE USER IF NOT EXISTS 'hotellink360_user'@'172.19.0.4' IDENTIFIED WITH mysql_native_password BY '123456';
GRANT ALL PRIVILEGES ON hotellink360_db.* TO 'hotellink360_user'@'172.19.0.4';

CREATE USER IF NOT EXISTS 'hotellink360_user'@'172.19.%' IDENTIFIED WITH mysql_native_password BY '123456';
GRANT ALL PRIVILEGES ON hotellink360_db.* TO 'hotellink360_user'@'172.19.%';

ALTER USER 'hotellink360_user'@'%' IDENTIFIED WITH mysql_native_password BY '123456';
GRANT ALL PRIVILEGES ON hotellink360_db.* TO 'hotellink360_user'@'%';

FLUSH PRIVILEGES;

SELECT User, Host, plugin FROM mysql.user WHERE User = 'hotellink360_user';