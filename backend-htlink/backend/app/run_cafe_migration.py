from app.core.config import settings
from sqlmodel import create_engine

# Use database URL from settings
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, echo=True)

# Read and execute SQL file
with open("/tmp/create_cafe_tables_fixed.sql", "r", encoding="utf-8") as f:
    sql_content = f.read()

# Split by semicolons and execute each statement
statements = [s.strip() for s in sql_content.split(';') if s.strip()]

with engine.begin() as conn:
    for statement in statements:
        if statement:
            print(f"\nExecuting: {statement[:100]}...")
            conn.exec_driver_sql(statement)

print("\n✅ All Cafe tables created successfully!")
