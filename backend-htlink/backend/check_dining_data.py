#!/usr/bin/env python3
"""Check vr_dining table data and fix enum issue"""
import mysql.connector
import os

# Database connection
db_config = {
    'host': 'localhost',
    'port': 3306,
    'user': 'hotellink',
    'password': 'hotellink_pass',
    'database': 'linkhotel360_saas'
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    # Check current data
    print("=" * 60)
    print("CHECKING VR_DINING TABLE")
    print("=" * 60)
    
    cursor.execute("SELECT COUNT(*) as total FROM vr_dining")
    count = cursor.fetchone()
    print(f"\nTotal dining records: {count['total']}")
    
    if count['total'] > 0:
        cursor.execute("SELECT id, code, status, dining_type FROM vr_dining LIMIT 10")
        rows = cursor.fetchall()
        print("\nExisting records:")
        for row in rows:
            print(f"  ID: {row['id']}, Code: {row['code']}, Status: {row['status']}, Type: {row['dining_type']}")
    
    # Check enum definition
    print("\n" + "=" * 60)
    print("CHECKING ENUM DEFINITION")
    print("=" * 60)
    cursor.execute("""
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'linkhotel360_saas' 
        AND TABLE_NAME = 'vr_dining' 
        AND COLUMN_NAME = 'status'
    """)
    enum_def = cursor.fetchone()
    print(f"\nCurrent enum definition: {enum_def['COLUMN_TYPE']}")
    
    # Propose solution
    print("\n" + "=" * 60)
    print("SOLUTION")
    print("=" * 60)
    print("\nThe issue is that SQLAlchemy has cached enum with UPPERCASE values")
    print("but the database has lowercase enum('active','inactive','closed')")
    print("\nBest solution: Change column from ENUM to VARCHAR to avoid this issue entirely")
    print("\nSQL to fix:")
    print("  ALTER TABLE vr_dining MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';")
    print("  ALTER TABLE vr_dining ADD CHECK (status IN ('active','inactive','closed'));")
    
    cursor.close()
    conn.close()
    print("\n✅ Check complete!")
    
except mysql.connector.Error as e:
    print(f"❌ Database error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")

