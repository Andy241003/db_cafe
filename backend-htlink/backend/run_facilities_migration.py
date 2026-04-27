#!/usr/bin/env python3
"""
Fix facilities schema: Add vr_link and convert status enum to VARCHAR
"""
import os
import sys
from sqlalchemy import create_engine, text

MYSQL_ROOT_PASSWORD = os.getenv("MYSQL_ROOT_PASSWORD", "VeryStrongRootPass2024!")
MYSQL_SERVER = os.getenv("MYSQL_SERVER", "db")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
DATABASE_NAME = "hotellink360_db"
DATABASE_URL = f"mysql+pymysql://root:{MYSQL_ROOT_PASSWORD}@{MYSQL_SERVER}:{MYSQL_PORT}/{DATABASE_NAME}"

def run_migration():
    print("=" * 70)
    print("FIXING VR_FACILITIES SCHEMA")
    print("=" * 70)
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Add vr_link column
        print("\n📋 Adding vr_link column...")
        try:
            conn.execute(text("""
                ALTER TABLE vr_facilities 
                ADD COLUMN vr_link VARCHAR(500) DEFAULT NULL
            """))
            conn.commit()
            print("   ✅ vr_link column added")
        except Exception as e:
            if "Duplicate column" in str(e):
                print("   ⚠️  vr_link column already exists")
            else:
                print(f"   ❌ Error: {e}")
                raise
        
        # Convert status enum to VARCHAR
        print("\n🔧 Converting status from ENUM to VARCHAR...")
        try:
            conn.execute(text("""
                ALTER TABLE vr_facilities 
                MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
            """))
            conn.commit()
            print("   ✅ Status converted to VARCHAR")
        except Exception as e:
            print(f"   ❌ Error: {e}")
            raise
        
        # Add CHECK constraint
        print("\n🔒 Adding CHECK constraint...")
        try:
            conn.execute(text("""
                ALTER TABLE vr_facilities 
                ADD CONSTRAINT chk_facility_status 
                CHECK (status IN ('active', 'inactive', 'maintenance'))
            """))
            conn.commit()
            print("   ✅ CHECK constraint added")
        except Exception as e:
            if "Duplicate" in str(e) or "exists" in str(e):
                print("   ⚠️  CHECK constraint already exists")
            else:
                print(f"   ⚠️  Could not add constraint: {e}")
        
        # Verify
        print("\n📋 Verifying changes...")
        result = conn.execute(text("""
            SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'hotellink360_db'
            AND TABLE_NAME = 'vr_facilities'
            AND COLUMN_NAME IN ('vr_link', 'status')
            ORDER BY COLUMN_NAME
        """))
        for row in result:
            print(f"   {row[0]}: {row[1]} (default: {row[2]})")
        
        # Check existing data
        result = conn.execute(text("SELECT COUNT(*) FROM vr_facilities"))
        count = result.fetchone()[0]
        print(f"\n📊 Total facilities: {count}")
    
    print("\n" + "=" * 70)
    print("✅ MIGRATION COMPLETE!")
    print("=" * 70)
    print("\n⚠️  Restart backend: docker restart backend-htlink-backend-1\n")

if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)

