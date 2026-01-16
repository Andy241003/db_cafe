"""
Fix dining status values by direct replacement
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_dining_status():
    """Update dining status from lowercase to uppercase"""
    
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    
    with engine.connect() as conn:
        # Check current status values
        result = conn.execute(text("""
            SELECT id, code, status FROM vr_dining
        """))
        
        rows = result.fetchall()
        print(f"Current dining records: {len(rows)}")
        for row in rows:
            print(f"  ID: {row[0]}, Code: {row[1]}, Status: '{row[2]}'")
        
        # Update each status value explicitly
        updates = [
            ("UPDATE vr_dining SET status = 'ACTIVE' WHERE status = 'active'", 'active->ACTIVE'),
            ("UPDATE vr_dining SET status = 'INACTIVE' WHERE status = 'inactive'", 'inactive->INACTIVE'),
            ("UPDATE vr_dining SET status = 'CLOSED' WHERE status = 'closed'", 'closed->CLOSED'),
        ]
        
        total_updated = 0
        for sql, desc in updates:
            result = conn.execute(text(sql))
            if result.rowcount > 0:
                print(f"✅ {desc}: Updated {result.rowcount} rows")
                total_updated += result.rowcount
        
        conn.commit()
        
        print(f"\n✅ Total updated: {total_updated} rows")
        
        # Verify
        result = conn.execute(text("""
            SELECT id, code, status FROM vr_dining
        """))
        
        rows = result.fetchall()
        print(f"\nAfter update:")
        for row in rows:
            print(f"  ID: {row[0]}, Code: {row[1]}, Status: '{row[2]}'")

if __name__ == "__main__":
    fix_dining_status()
