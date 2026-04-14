#!/bin/bash
docker-compose -f backend-htlink/docker-compose.dev.yml exec -T backend python << 'EOF'
import pymysql
conn = pymysql.connect(host='travel.link360.vn', user='vrcafe_user', password='cafe@1234', database='vrcafe_db')
cursor = conn.cursor()
cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'tenant_id'")
if cursor.fetchone():
    print('✓ tenant_id column already exists')
else:
    print('→ Adding tenant_id column...')
    cursor.execute("ALTER TABLE admin_users ADD COLUMN tenant_id BIGINT NULL DEFAULT 1 AFTER id")
    cursor.execute("ALTER TABLE admin_users ADD CONSTRAINT fk_admin_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE")
    conn.commit()
    print('✓ Migration completed successfully')
cursor.close()
conn.close()
EOF
