from app.core.config import settings
from sqlmodel import create_engine

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

with engine.connect() as conn:
    result = conn.exec_driver_sql("DESCRIBE tenants")
    print("\nTenants table schema:")
    print("-" * 80)
    for row in result:
        print(row)
