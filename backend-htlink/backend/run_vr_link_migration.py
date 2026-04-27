"""
Migration script to add vr_link column to vr_rooms table
"""
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    """Add vr_link column and migrate data from attributes_json"""
    
    # Create engine
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT COUNT(*) as count
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'vr_rooms'
            AND COLUMN_NAME = 'vr_link'
        """))
        
        exists = result.fetchone()[0] > 0
        
        if exists:
            print("✅ Column vr_link already exists in vr_rooms table")
            return
        
        print("📝 Adding vr_link column to vr_rooms table...")
        
        # Add column
        conn.execute(text("""
            ALTER TABLE vr_rooms
            ADD COLUMN vr_link VARCHAR(500) DEFAULT NULL
            AFTER price_per_night
        """))
        
        print("✅ Column vr_link added successfully")
        
        # Migrate data from attributes_json
        print("📝 Migrating vr_link data from attributes_json...")
        
        result = conn.execute(text("""
            UPDATE vr_rooms
            SET vr_link = JSON_UNQUOTE(JSON_EXTRACT(attributes_json, '$.vr_link'))
            WHERE attributes_json IS NOT NULL
            AND JSON_EXTRACT(attributes_json, '$.vr_link') IS NOT NULL
        """))
        
        print(f"✅ Migrated {result.rowcount} rows")
        
        # Optional: Clean up attributes_json (commented out by default)
        # Uncomment below if you want to remove vr_link from attributes_json
        # conn.execute(text("""
        #     UPDATE vr_rooms
        #     SET attributes_json = JSON_REMOVE(attributes_json, '$.vr_link')
        #     WHERE vr_link IS NOT NULL
        #     AND attributes_json IS NOT NULL
        #     AND JSON_EXTRACT(attributes_json, '$.vr_link') IS NOT NULL
        # """))
        
        conn.commit()
        
        print("🎉 Migration completed successfully!")

if __name__ == "__main__":
    run_migration()

