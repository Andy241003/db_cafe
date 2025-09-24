#!/usr/bin/env python3
import pymysql
import os

try:
    conn = pymysql.connect(
        host=os.getenv('MYSQL_SERVER', 'db'),
        user=os.getenv('MYSQL_USER', 'hotellink360_user'), 
        password=os.getenv('MYSQL_PASSWORD', '123456'),
        database=os.getenv('MYSQL_DATABASE', 'hotellink360_db'),
        port=int(os.getenv('MYSQL_PORT', 3306))
    )
    print("✅ Database connection successful!")
    
    with conn.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"📋 Found {len(tables)} tables in database")
        for table in tables:
            print(f"  - {table[0]}")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Database connection failed: {e}")