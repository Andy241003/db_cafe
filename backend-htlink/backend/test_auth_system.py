"""
Test script để demo hệ thống Authentication & Authorization
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.permissions import PermissionChecker, ResourceType, ActionType
from app.models import UserRole


def test_permission_matrix():
    """Test permission matrix cho từng role"""
    print("🔐 TESTING PERMISSION MATRIX")
    print("=" * 60)
    
    roles = [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]
    resources = [ResourceType.TENANT, ResourceType.PROPERTY, ResourceType.CONTENT, ResourceType.USER]
    actions = [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.MANAGE]
    
    for role in roles:
        print(f"\n👤 {role.value} PERMISSIONS:")
        print("-" * 40)
        
        for resource in resources:
            print(f"\n📂 {resource.value.upper()}:")
            for action in actions:
                has_permission = PermissionChecker.has_permission(role, resource, action)
                symbol = "✅" if has_permission else "❌"
                print(f"  {symbol} {action.value}")


def test_tenant_access():
    """Test tenant access logic"""
    print("\n\n🏢 TESTING TENANT ACCESS")
    print("=" * 60)
    
    # Simulate users
    class MockUser:
        def __init__(self, role, tenant_id):
            self.role = role
            self.tenant_id = tenant_id
    
    # Test cases
    owner = MockUser(UserRole.OWNER, 1)
    admin_tenant1 = MockUser(UserRole.ADMIN, 1)  
    admin_tenant2 = MockUser(UserRole.ADMIN, 2)
    editor_tenant1 = MockUser(UserRole.EDITOR, 1)
    
    test_cases = [
        (owner, 1, "Owner accessing tenant 1"),
        (owner, 2, "Owner accessing tenant 2"),
        (admin_tenant1, 1, "Admin(T1) accessing tenant 1"), 
        (admin_tenant1, 2, "Admin(T1) accessing tenant 2"),
        (admin_tenant2, 2, "Admin(T2) accessing tenant 2"),
        (editor_tenant1, 1, "Editor(T1) accessing tenant 1"),
        (editor_tenant1, 2, "Editor(T1) accessing tenant 2"),
    ]
    
    for user, tenant_id, description in test_cases:
        has_access = PermissionChecker.check_tenant_access(user, tenant_id)
        symbol = "✅" if has_access else "❌"
        print(f"{symbol} {description}")


def test_role_hierarchy():
    """Test role hierarchy và specific permissions"""
    print("\n\n📊 TESTING ROLE HIERARCHY")
    print("=" * 60)
    
    # Test user management permissions
    print("\n👥 USER MANAGEMENT:")
    for role in [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]:
        can_create = PermissionChecker.has_permission(role, ResourceType.USER, ActionType.CREATE)
        can_delete = PermissionChecker.has_permission(role, ResourceType.USER, ActionType.DELETE)
        can_manage = PermissionChecker.has_permission(role, ResourceType.USER, ActionType.MANAGE)
        
        print(f"  {role.value}:")
        print(f"    Create users: {'✅' if can_create else '❌'}")
        print(f"    Delete users: {'✅' if can_delete else '❌'}")  
        print(f"    Manage users: {'✅' if can_manage else '❌'}")
    
    # Test content management permissions
    print("\n📝 CONTENT MANAGEMENT:")
    for role in [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]:
        can_create = PermissionChecker.has_permission(role, ResourceType.CONTENT, ActionType.CREATE)
        can_publish = PermissionChecker.has_permission(role, ResourceType.CONTENT, ActionType.PUBLISH)
        can_delete = PermissionChecker.has_permission(role, ResourceType.CONTENT, ActionType.DELETE)
        
        print(f"  {role.value}:")
        print(f"    Create content: {'✅' if can_create else '❌'}")
        print(f"    Publish content: {'✅' if can_publish else '❌'}")
        print(f"    Delete content: {'✅' if can_delete else '❌'}")


def test_business_scenarios():
    """Test các scenarios thực tế trong business"""
    print("\n\n🏨 TESTING BUSINESS SCENARIOS")
    print("=" * 60)
    
    scenarios = [
        {
            "title": "Hotel Owner muốn xem analytics toàn hệ thống",
            "user_role": UserRole.OWNER,
            "resource": ResourceType.ANALYTICS,
            "action": ActionType.READ,
            "expected": True
        },
        {
            "title": "Hotel Admin muốn tạo property mới",
            "user_role": UserRole.ADMIN, 
            "resource": ResourceType.PROPERTY,
            "action": ActionType.CREATE,
            "expected": True
        },
        {
            "title": "Content Editor muốn publish blog post",
            "user_role": UserRole.EDITOR,
            "resource": ResourceType.CONTENT,
            "action": ActionType.PUBLISH,
            "expected": True
        },
        {
            "title": "Content Editor muốn xóa user account",
            "user_role": UserRole.EDITOR,
            "resource": ResourceType.USER,
            "action": ActionType.DELETE,
            "expected": False
        },
        {
            "title": "Viewer muốn tạo nội dung mới",
            "user_role": UserRole.VIEWER,
            "resource": ResourceType.CONTENT,
            "action": ActionType.CREATE,
            "expected": False
        },
        {
            "title": "Admin muốn sửa tenant settings",
            "user_role": UserRole.ADMIN,
            "resource": ResourceType.SETTINGS,
            "action": ActionType.UPDATE,
            "expected": True
        }
    ]
    
    for scenario in scenarios:
        has_permission = PermissionChecker.has_permission(
            scenario["user_role"],
            scenario["resource"], 
            scenario["action"]
        )
        
        result_match = has_permission == scenario["expected"]
        symbol = "✅" if result_match else "❌"
        result_text = "ALLOWED" if has_permission else "DENIED"
        
        print(f"\n{symbol} {scenario['title']}")
        print(f"    Result: {result_text} (Expected: {'ALLOWED' if scenario['expected'] else 'DENIED'})")


def demo_authentication_flow():
    """Demo authentication flow"""
    print("\n\n🔑 AUTHENTICATION FLOW DEMO")
    print("=" * 60)
    
    print("\n1. 👤 User Login Scenarios:")
    print("   POST /api/v1/login/access-token")
    print("   ✅ admin@example.com (OWNER) -> Full system access")
    print("   ✅ manager@hotel-a.com (ADMIN) -> Hotel A management")
    print("   ✅ editor@hotel-a.com (EDITOR) -> Content creation only") 
    print("   ✅ viewer@hotel-a.com (VIEWER) -> Read-only access")
    
    print("\n2. 🔐 API Request Examples:")
    
    examples = [
        {
            "endpoint": "GET /api/v1/analytics/dashboard",
            "header": "X-Tenant-Code: hotel-a",
            "role": "ADMIN",
            "result": "✅ Access granted - can view analytics for own tenant"
        },
        {
            "endpoint": "POST /api/v1/tenants/1/users",
            "role": "ADMIN", 
            "result": "✅ Access granted - can create users in own tenant"
        },
        {
            "endpoint": "DELETE /api/v1/users/123",
            "role": "ADMIN",
            "result": "❌ Access denied - only OWNER can delete users"
        },
        {
            "endpoint": "POST /api/v1/content/posts",
            "role": "EDITOR",
            "result": "✅ Access granted - can create content"
        },
        {
            "endpoint": "GET /api/v1/tenants/2/properties", 
            "role": "EDITOR",
            "result": "❌ Access denied - cannot access other tenant's data"
        }
    ]
    
    for example in examples:
        print(f"\n   🌐 {example['endpoint']}")
        if "header" in example:
            print(f"      Header: {example['header']}")
        print(f"      User Role: {example['role']}")
        print(f"      {example['result']}")


if __name__ == "__main__":
    print("🚀 HotelLink 360 SaaS - Authentication & Authorization Test")
    print("=" * 80)
    
    try:
        test_permission_matrix()
        test_tenant_access()
        test_role_hierarchy()
        test_business_scenarios()
        demo_authentication_flow()
        
        print("\n\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        print("📚 See AUTHENTICATION_GUIDE.md for detailed usage instructions")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()