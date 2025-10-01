#!/usr/bin/env python3

import sys
import os

# Add the backend directory to Python path
sys.path.append('/app')

from sqlmodel import Session, select
from app.core.db import engine
from app.models import AdminUser

def list_all_users():
    """List all users in the database"""
    
    with Session(engine) as session:
        # Get all users
        users = session.exec(select(AdminUser)).all()
        
        print("=== ALL USERS IN DATABASE ===")
        for user in users:
            print(f"ID: {user.id}, Name: {user.full_name}, Email: {user.email}, Role: {user.role}, Tenant: {user.tenant_id}, Active: {user.is_active}")
        
        return users

def delete_tenant2_user():
    """Delete a user from tenant 2"""
    
    with Session(engine) as session:
        # Find users in tenant 2
        tenant2_users = session.exec(
            select(AdminUser).where(AdminUser.tenant_id == 2)
        ).all()
        
        if not tenant2_users:
            print("No users found in tenant 2")
            return
            
        print(f"\nFound {len(tenant2_users)} users in tenant 2:")
        for user in tenant2_users:
            print(f"  - ID: {user.id}, Name: {user.full_name}, Email: {user.email}, Role: {user.role}")
        
        # Delete the first non-owner user from tenant 2
        user_to_delete = None
        for user in tenant2_users:
            if user.role != 'OWNER':  # Don't delete owner users
                user_to_delete = user
                break
        
        if not user_to_delete:
            print("No non-owner users found in tenant 2 to delete")
            return
            
        print(f"\nDeleting user: {user_to_delete.full_name} ({user_to_delete.email})")
        session.delete(user_to_delete)
        session.commit()
        print("✅ User deleted successfully!")

if __name__ == "__main__":
    list_all_users()
    print("\n" + "="*50)
    delete_tenant2_user()
    print("\n" + "="*50)
    print("USERS AFTER DELETION:")
    list_all_users()