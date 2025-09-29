#!/usr/bin/env python3
"""
Debug script for production issues
"""
import sys
import traceback
from sqlmodel import Session
from app.core.db import engine
from app.core.config import settings
from app import crud
from app.core.security import verify_password, get_password_hash

def test_database_connection():
    """Test database connection"""
    try:
        from sqlmodel import text
        with Session(engine) as session:
            result = session.exec(text("SELECT 1")).first()
            print("✅ Database connection: OK")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_user_exists():
    """Test if admin user exists"""
    try:
        with Session(engine) as session:
            user = crud.admin_user.get_by_email(
                session, 
                email=settings.FIRST_SUPERUSER
            )
            if user:
                print(f"✅ Admin user exists: {user.email}")
                print(f"   - ID: {user.id}")
                print(f"   - Active: {user.is_active}")
                print(f"   - Role: {user.role}")
                print(f"   - Tenant ID: {user.tenant_id}")
                return user
            else:
                print("❌ Admin user not found")
                return None
    except Exception as e:
        print(f"❌ Error checking user: {e}")
        traceback.print_exc()
        return None

def test_password_verification():
    """Test password verification"""
    try:
        # Test with known password
        test_hash = get_password_hash("SuperSecretPass123")
        is_valid = verify_password("SuperSecretPass123", test_hash)
        print(f"✅ Password hashing/verification: {'OK' if is_valid else 'FAILED'}")
        return is_valid
    except Exception as e:
        print(f"❌ Password verification failed: {e}")
        traceback.print_exc()
        return False

def test_authentication():
    """Test full authentication flow"""
    try:
        with Session(engine) as session:
            user = crud.admin_user.authenticate(
                session,
                email=settings.FIRST_SUPERUSER,
                password=settings.FIRST_SUPERUSER_PASSWORD
            )
            if user:
                print("✅ Authentication: OK")
                return True
            else:
                print("❌ Authentication: FAILED")
                return False
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        traceback.print_exc()
        return False

def main():
    print("🔍 Production Debug Script")
    print("=" * 50)
    
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Database URL: {settings.SQLALCHEMY_DATABASE_URI}")
    print(f"First superuser: {settings.FIRST_SUPERUSER}")
    print()
    
    # Run tests
    tests = [
        ("Database Connection", test_database_connection),
        ("User Exists", test_user_exists),
        ("Password Verification", test_password_verification),
        ("Full Authentication", test_authentication),
    ]
    
    results = {}
    for test_name, test_func in tests:
        print(f"Testing {test_name}...")
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results[test_name] = False
        print()
    
    # Summary
    print("📊 Summary:")
    print("-" * 30)
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")

if __name__ == "__main__":
    main()