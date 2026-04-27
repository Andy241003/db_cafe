from app.core.config import settings
from sqlmodel import create_engine

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

with engine.connect() as conn:
    result = conn.exec_driver_sql("SHOW TABLES LIKE 'cafe%%'")
    tables = [row[0] for row in result]
    
    print("\n" + "="*60)
    print(f"✅ Cafe Management System - Database Schema Created!")
    print("="*60)
    print(f"\nTotal tables: {len(tables)}\n")
    
    for i, table in enumerate(sorted(tables), 1):
        print(f"  {i:2d}. {table}")
    
    print("\n" + "="*60)

