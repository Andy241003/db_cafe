"""
Tenant Management CLI Commands
Usage: python -m app.scripts.tenant_management
"""
import asyncio
from typing import Optional
from sqlmodel import Session, select

from app.core.db import engine
from app.models import Tenant, Plan, AdminUser
from app.core.security import get_password_hash


class TenantManager:
    """Tenant management utilities"""
    
    def __init__(self):
        self.session = Session(engine)
    
    def create_tenant(
        self,
        name: str,
        code: str,
        plan_code: str = "basic",
        default_locale: str = "en",
        admin_email: str = None,
        admin_password: str = None,
        admin_name: str = None
    ) -> Tenant:
        """
        Create a new tenant with optional admin user
        """
        # Check if tenant already exists
        existing = self.session.exec(
            select(Tenant).where(Tenant.code == code)
        ).first()
        
        if existing:
            raise ValueError(f"Tenant with code '{code}' already exists")
        
        # Get plan
        plan = self.session.exec(
            select(Plan).where(Plan.code == plan_code)
        ).first()
        
        if not plan:
            raise ValueError(f"Plan '{plan_code}' not found")
        
        # Create tenant
        tenant = Tenant(
            name=name,
            code=code,
            plan_id=plan.id,
            default_locale=default_locale,
            is_active=True
        )
        
        self.session.add(tenant)
        self.session.commit()
        self.session.refresh(tenant)
        
        # Create admin user if provided
        if admin_email and admin_password and admin_name:
            admin_user = AdminUser(
                tenant_id=tenant.id,
                email=admin_email,
                password_hash=get_password_hash(admin_password),
                full_name=admin_name,
                role="OWNER",
                is_active=True
            )
            
            self.session.add(admin_user)
            self.session.commit()
            
            print(f"✅ Created admin user: {admin_email}")
        
        print(f"✅ Created tenant: {name} ({code})")
        return tenant
    
    def list_tenants(self) -> list[Tenant]:
        """List all tenants"""
        tenants = self.session.exec(select(Tenant)).all()
        
        print("\n📋 TENANTS:")
        print("-" * 80)
        print(f"{'ID':<5} {'Code':<15} {'Name':<25} {'Plan':<10} {'Active':<8} {'Users':<6}")
        print("-" * 80)
        
        for tenant in tenants:
            # Count users
            user_count = len(self.session.exec(
                select(AdminUser).where(AdminUser.tenant_id == tenant.id)
            ).all())
            
            plan_name = tenant.plan.code if tenant.plan else "None"
            status = "✅" if tenant.is_active else "❌"
            
            print(f"{tenant.id:<5} {tenant.code:<15} {tenant.name:<25} {plan_name:<10} {status:<8} {user_count:<6}")
        
        print("-" * 80)
        return tenants
    
    def activate_tenant(self, code: str) -> bool:
        """Activate a tenant"""
        tenant = self.session.exec(
            select(Tenant).where(Tenant.code == code)
        ).first()
        
        if not tenant:
            print(f"❌ Tenant '{code}' not found")
            return False
        
        tenant.is_active = True
        self.session.add(tenant)
        self.session.commit()
        
        print(f"✅ Activated tenant: {code}")
        return True
    
    def deactivate_tenant(self, code: str) -> bool:
        """Deactivate a tenant"""
        tenant = self.session.exec(
            select(Tenant).where(Tenant.code == code)
        ).first()
        
        if not tenant:
            print(f"❌ Tenant '{code}' not found")
            return False
        
        tenant.is_active = False
        self.session.add(tenant)
        self.session.commit()
        
        print(f"⚠️ Deactivated tenant: {code}")
        return True
    
    def delete_tenant(self, code: str, confirm: bool = False) -> bool:
        """Delete a tenant (dangerous!)"""
        if not confirm:
            print("❌ Must pass confirm=True to delete tenant")
            return False
        
        tenant = self.session.exec(
            select(Tenant).where(Tenant.code == code)
        ).first()
        
        if not tenant:
            print(f"❌ Tenant '{code}' not found")
            return False
        
        # Delete associated users first
        users = self.session.exec(
            select(AdminUser).where(AdminUser.tenant_id == tenant.id)
        ).all()
        
        for user in users:
            self.session.delete(user)
        
        # Delete tenant
        self.session.delete(tenant)
        self.session.commit()
        
        print(f"🗑️ Deleted tenant: {code} and {len(users)} users")
        return True
    
    def tenant_info(self, code: str) -> Optional[Tenant]:
        """Get detailed tenant information"""
        tenant = self.session.exec(
            select(Tenant).where(Tenant.code == code)
        ).first()
        
        if not tenant:
            print(f"❌ Tenant '{code}' not found")
            return None
        
        users = self.session.exec(
            select(AdminUser).where(AdminUser.tenant_id == tenant.id)
        ).all()
        
        print(f"\n🏢 TENANT INFO: {tenant.name}")
        print("=" * 50)
        print(f"ID: {tenant.id}")
        print(f"Code: {tenant.code}")
        print(f"Name: {tenant.name}")
        print(f"Plan: {tenant.plan.code if tenant.plan else 'None'}")
        print(f"Default Locale: {tenant.default_locale}")
        print(f"Active: {'✅ Yes' if tenant.is_active else '❌ No'}")
        print(f"Created: {tenant.created_at}")
        print(f"Updated: {tenant.updated_at}")
        
        print(f"\n👥 USERS ({len(users)}):")
        print("-" * 50)
        for user in users:
            status = "✅" if user.is_active else "❌"
            print(f"  {status} {user.email} ({user.role}) - {user.full_name}")
        
        return tenant
    
    def close(self):
        """Close database session"""
        self.session.close()


def main():
    """CLI interface for tenant management"""
    import sys
    
    if len(sys.argv) < 2:
        print("""
🏢 TENANT MANAGEMENT CLI

Usage:
  python -m app.scripts.tenant_management <command> [args...]

Commands:
  list                              - List all tenants
  create <name> <code> [plan]       - Create tenant
  info <code>                       - Show tenant details  
  activate <code>                   - Activate tenant
  deactivate <code>                 - Deactivate tenant
  delete <code> --confirm           - Delete tenant (dangerous!)

Examples:
  python -m app.scripts.tenant_management list
  python -m app.scripts.tenant_management create "Hotel ABC" hotelabc basic
  python -m app.scripts.tenant_management info demo
  python -m app.scripts.tenant_management activate hotelxyz
""")
        return
    
    manager = TenantManager()
    command = sys.argv[1]
    
    try:
        if command == "list":
            manager.list_tenants()
        
        elif command == "create":
            if len(sys.argv) < 4:
                print("❌ Usage: create <name> <code> [plan]")
                return
            
            name = sys.argv[2]
            code = sys.argv[3]
            plan = sys.argv[4] if len(sys.argv) > 4 else "basic"
            
            manager.create_tenant(name, code, plan)
        
        elif command == "info":
            if len(sys.argv) < 3:
                print("❌ Usage: info <code>")
                return
            
            manager.tenant_info(sys.argv[2])
        
        elif command == "activate":
            if len(sys.argv) < 3:
                print("❌ Usage: activate <code>")
                return
            
            manager.activate_tenant(sys.argv[2])
        
        elif command == "deactivate":
            if len(sys.argv) < 3:
                print("❌ Usage: deactivate <code>")
                return
            
            manager.deactivate_tenant(sys.argv[2])
        
        elif command == "delete":
            if len(sys.argv) < 3:
                print("❌ Usage: delete <code> --confirm")
                return
            
            code = sys.argv[2]
            confirm = "--confirm" in sys.argv
            
            if not confirm:
                print("❌ Must add --confirm flag to delete tenant")
                return
            
            manager.delete_tenant(code, confirm=True)
        
        else:
            print(f"❌ Unknown command: {command}")
    
    finally:
        manager.close()


if __name__ == "__main__":
    main()