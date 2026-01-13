#!/usr/bin/env python3
"""
Script to run database migration for adding service_access column
"""
import mysql.connector
from mysql.connector import Error

def run_migration():
    try:
        # Connection parameters
        conn = mysql.connector.connect(
            host='127.0.0.1',
            port=3307,
            user='root',
            password='root',
            database='hotellink_db'
        )
        
        if conn.is_connected():
            db_info = conn.get_server_info()
            print(f"Connected to MySQL Server version {db_info}")
            
            cursor = conn.cursor()
            
            # Read migration SQL
            with open('backend/migrations/add_service_access_to_admin_users.sql', 'r') as f:
                sql_commands = f.read()
            
            # Execute migration (handling multiple statements)
            for statement in sql_commands.split(';'):
                statement = statement.strip()
                if statement and not statement.startswith('--'):
                    print(f"Executing: {statement[:80]}...")
                    cursor.execute(statement)
            
            conn.commit()
            print("✅ Migration completed successfully!")
            
            # Verify column was added
            cursor.execute("DESCRIBE admin_users")
            columns = cursor.fetchall()
            print("\nColumns in admin_users table:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]}")
            
            cursor.close()
            
    except Error as e:
        print(f"❌ Error: {e}")
    finally:
        if conn.is_connected():
            conn.close()
            print("\nDatabase connection closed")

if __name__ == "__main__":
    run_migration()
