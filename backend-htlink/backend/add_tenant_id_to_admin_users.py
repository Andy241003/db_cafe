#!/usr/bin/env python3
"""
Migration script to add tenant_id column to admin_users table
Run this script to update the database schema
"""

import pymysql
import sys

def migrate():
    try:
        conn = pymysql.connect(
            host='travel.link360.vn',
            user='vrcafe_user',
            password='cafe@1234',
            database='vrcafe_db'
        )
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'tenant_id'
        """)
        
        if cursor.fetchone():
            print("✓ tenant_id column already exists in admin_users table")
        else:
            print("→ Adding tenant_id column to admin_users table...")
            
            # Add column
            cursor.execute("""
                ALTER TABLE admin_users 
                ADD COLUMN tenant_id BIGINT NULL DEFAULT 1 
                AFTER id
            """)
            print("✓ Column added")
            
            # Add foreign key constraint
            cursor.execute("""
                ALTER TABLE admin_users 
                ADD CONSTRAINT fk_admin_users_tenant 
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) 
                ON DELETE CASCADE
            """)
            print("✓ Foreign key constraint added")
            
            conn.commit()
            print("✓ Migration completed successfully")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Migration failed: {e}", file=sys.stderr)
        return False

if __name__ == '__main__':
    success = migrate()
    sys.exit(0 if success else 1)
