#!/usr/bin/env python3
"""
Script to create all database tables from SQLAlchemy models
"""
import sys
sys.path.append('/app')

from sqlmodel import SQLModel, create_engine
from app.models import *  # Import tất cả models
from app.core.config import settings

def create_tables():
    print("Creating database tables...")
    engine = create_engine(str(settings.DATABASE_URL), echo=True)
    
    # Tạo tất cả tables
    SQLModel.metadata.create_all(engine)
    print("All tables created successfully!")

if __name__ == "__main__":
    create_tables()