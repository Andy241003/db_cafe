#!/usr/bin/env python3
"""
Update admin password hash for testing
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.core.security import get_password_hash
from app.core.config import settings
from sqlmodel import create_engine, Session, select
from app.models import AdminUser

# Database connection
DATABASE_URL = f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
engine = create_engine(DATABASE_URL)

def update_password():
    with Session(engine) as session:
        # Find admin user
        user = session.exec(
            select(AdminUser).where(AdminUser.email == "admin@travel.link360.vn")
        ).first()

        if not user:
            print("Admin user not found")
            return

        # Update password
        hashed_password = get_password_hash("admin123")
        user.hashed_password = hashed_password
        session.commit()

        print(f"Updated password for user {user.email}")

if __name__ == "__main__":
    update_password()