#!/usr/bin/env python3

import sys
import os

# Add the backend directory to Python path
sys.path.append('/app')

from sqlmodel import Session, select
from app.core.db import engine
from app.models import AdminUser
from app.core.security import get_password_hash, verify_password

def update_admin_password():
    """Update the existing admin user password"""
    
    with Session(engine) as session:
        # Get the existing admin user
        admin_user = session.exec(
            select(AdminUser).where(AdminUser.email == "admin@travel.link360.vn")
        ).first()
        
        if admin_user:
            print(f"Found admin user: {admin_user.email}")
            print(f"Current password hash: {admin_user.password_hash[:50]}...")
            
            # Update password to "admin123"
            admin_user.password_hash = get_password_hash("admin123")
            session.add(admin_user)
            session.commit()
            print("Password updated to 'admin123'")
            
            # Verify the password works
            if verify_password("admin123", admin_user.password_hash):
                print("✓ Password verification successful")
            else:
                print("✗ Password verification failed")
        else:
            print("Admin user not found")

if __name__ == "__main__":
    update_admin_password()