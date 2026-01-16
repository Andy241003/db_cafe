#!/usr/bin/env python3
"""
Convert vr_dining.status from ENUM to VARCHAR to fix SQLAlchemy caching issues
"""
import os
import sys
from sqlalchemy import create_engine, text

# Get database URL from environment - use pymysql driver with root user
MYSQL_ROOT_PASSWORD = os.getenv("MYSQL_ROOT_PASSWORD", "VeryStrongRootPass2024!")
MYSQL_SERVER = os.getenv("MYSQL_SERVER", "db")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
DATABASE_NAME = "hotellink360_db"
DATABASE_URL = f"mysql+pymysql://root:{MYSQL_ROOT_PASSWORD}@{MYSQL_SERVER}:{MYSQL_PORT}/{DATABASE_NAME}"

def run_migration():
    print("=" * 70)
    print("FIXING VR_DINING STATUS ENUM TO VARCHAR")
    print("=" * 70)
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check current column type
        print("\n📋 Checking current column type...")
        result = conn.execute(text("""
            SELECT COLUMN_TYPE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'hotellink360_db'
            AND TABLE_NAME = 'vr_dining'
            AND COLUMN_NAME = 'status'
        """))
        current = result.fetchone()
        if current:
            print(f"   Current type: {current[0]}")
            print(f"   Default: {current[1]}")
        
        # Convert ENUM to VARCHAR
        print("\n🔧 Converting status column from ENUM to VARCHAR...")
        conn.execute(text("""
            ALTER TABLE vr_dining 
            MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
        """))
        conn.commit()
        print("   ✅ Column type changed successfully")
        
        # Add CHECK constraint
        print("\n🔒 Adding CHECK constraint...")
        try:
            conn.execute(text("""
                ALTER TABLE vr_dining 
                ADD CONSTRAINT chk_dining_status 
                CHECK (status IN ('active', 'inactive', 'closed'))
            """))
            conn.commit()
            print("   ✅ CHECK constraint added")
        except Exception as e:
            if "Duplicate" in str(e) or "exists" in str(e):
                print("   ⚠️  CHECK constraint already exists (skipping)")
            else:
                print(f"   ⚠️  Could not add CHECK constraint: {e}")
        
        # Verify the change
        print("\n📋 Verifying new column definition...")
        result = conn.execute(text("""
            SELECT COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'hotellink360_db'
            AND TABLE_NAME = 'vr_dining'
            AND COLUMN_NAME = 'status'
        """))
        new = result.fetchone()
        if new:
            print(f"   New type: {new[0]}")
            print(f"   Default: {new[1]}")
            print(f"   Nullable: {new[2]}")
        
        # Check existing data
        print("\n📊 Checking existing dining records...")
        result = conn.execute(text("SELECT COUNT(*) FROM vr_dining"))
        count = result.fetchone()[0]
        print(f"   Total records: {count}")
        
        if count > 0:
            result = conn.execute(text("SELECT status, COUNT(*) as cnt FROM vr_dining GROUP BY status"))
            for row in result:
                print(f"   - {row[0]}: {row[1]} records")
    
    print("\n" + "=" * 70)
    print("✅ MIGRATION COMPLETE!")
    print("=" * 70)
    print("\n⚠️  IMPORTANT: Restart the backend container to clear SQLAlchemy cache:")
    print("   docker restart backend-htlink-backend-1")
    print()

if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
