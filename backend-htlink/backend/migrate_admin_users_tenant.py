#!/usr/bin/env python3
"""Add tenant_id column to admin_users table if it doesn't exist"""

import pymysql
import sys

try:
    # Connect to remote database
    conn = pymysql.connect(
        host='travel.link360.vn',
        user='vrcafe_user',
        password='cafe@1234',
        database='vrcafe_db'
    )
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("""
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'tenant_id'
    """)
    
    if cursor.fetchone():
        print("✓ Column tenant_id already exists")
    else:
        print("→ Adding tenant_id column...")
        # Add column with default value 1
        cursor.execute("ALTER TABLE admin_users ADD COLUMN tenant_id BIGINT NULL DEFAULT 1 AFTER id")
        print("✓ Column added")
        
        # Add foreign key
        try:
            cursor.execute("""
                ALTER TABLE admin_users 
                ADD CONSTRAINT fk_admin_users_tenant 
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) 
                ON DELETE CASCADE
            """)
            print("✓ Foreign key added")
        except pymysql.Error as e:
            if 'Duplicate key name' in str(e):
                print("✓ Foreign key already exists")
            else:
                raise
        
        conn.commit()
        print("✓ Migration completed successfully")
    
    cursor.close()
    conn.close()
    sys.exit(0)
    
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

