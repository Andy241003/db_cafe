"""
Check and fix dining status enum definition
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from app.core.config import settings

def check_and_fix_enum():
    """Check current enum definition and fix if needed"""
    
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    
    with engine.connect() as conn:
        # Check current enum definition
        result = conn.execute(text("""
            SHOW COLUMNS FROM vr_dining LIKE 'status'
        """))
        
        for row in result:
            print(f"Column: {row[0]}")
            print(f"Type: {row[1]}")
            print(f"Null: {row[2]}")
            print(f"Key: {row[3]}")
            print(f"Default: {row[4]}")
            print(f"Extra: {row[5]}")
        
        print("\n" + "="*50)
        print("Attempting to fix enum definition...")
        print("="*50 + "\n")
        
        # The issue is that database has enum('active','inactive','closed')
        # but we need it to match or we need to use a different approach
        
        # Option 1: Remove enum constraint and use VARCHAR
        # Option 2: Make sure Python enum values match database exactly
        
        # Let's verify what's actually in database
        result = conn.execute(text("""
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'vr_dining' 
            AND COLUMN_NAME = 'status'
        """))
        
        for row in result:
            print(f"Actual ENUM definition: {row[0]}")

if __name__ == "__main__":
    check_and_fix_enum()

