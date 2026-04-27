"""
Fix dining status values from lowercase to uppercase
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
            SELECT DISTINCT status FROM vr_dining
        """))
        
        current_values = [row[0] for row in result]
        print(f"Current status values: {current_values}")
        
        # Update to uppercase
        result = conn.execute(text("""
            UPDATE vr_dining 
            SET status = UPPER(status) 
            WHERE status IN ('active', 'inactive', 'closed')
        """))
        
        conn.commit()
        
        print(f"✅ Updated {result.rowcount} rows")
        
        # Verify
        result = conn.execute(text("""
            SELECT DISTINCT status FROM vr_dining
        """))
        
        new_values = [row[0] for row in result]
        print(f"New status values: {new_values}")

if __name__ == "__main__":
    fix_dining_status()

