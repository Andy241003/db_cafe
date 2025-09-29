#!/usr/bin/env python3

import sys
import os

# Add the backend directory to Python path
sys.path.append('/app')

from sqlmodel import Session, select
from app.core.db import engine
from app.models import AdminUser
from app.core.security import get_password_hash

def create_test_user():
    """Create a test user for authentication testing"""
    
    with Session(engine) as session:
        # Check if test user already exists
        existing_user = session.exec(
            select(AdminUser).where(AdminUser.email == "test@demo.com")
        ).first()
        
        if existing_user:
            print("Test user already exists, updating password...")
            existing_user.password_hash = get_password_hash("test123")
            session.add(existing_user)
            session.commit()
            print(f"Updated user: {existing_user.email}")
        else:
            print("Creating new test user...")
            test_user = AdminUser(
                tenant_id=1,  # Demo tenant
                email="test@demo.com",
                password_hash=get_password_hash("test123"),
                full_name="Test User",
                role="ADMIN",
                is_active=True
            )
            session.add(test_user)
            session.commit()
            session.refresh(test_user)
            print(f"Created user: {test_user.email} with ID: {test_user.id}")

if __name__ == "__main__":
    create_test_user()