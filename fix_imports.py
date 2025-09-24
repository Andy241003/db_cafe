import re
import os

# Các file cần sửa
files_to_fix = [
    r"c:\Users\DONG\Downloads\hotel-link\backend-htlink\backend\app\api\v1\endpoints\translations.py",
    r"c:\Users\DONG\Downloads\hotel-link\backend-htlink\backend\app\api\v1\endpoints\property_categories.py",
    r"c:\Users\DONG\Downloads\hotel-link\backend-htlink\backend\app\api\v1\endpoints\features.py",
    r"c:\Users\DONG\Downloads\hotel-link\backend-htlink\backend\app\api\v1\endpoints\media.py",
    r"c:\Users\DONG\Downloads\hotel-link\backend-htlink\backend\app\api\v1\endpoints\posts.py",
    r"c:\Users\DONG\Downloads\hotel-link\backend-htlink\backend\app\api\v1\endpoints\users.py",
]

for file_path in files_to_fix:
    if os.path.exists(file_path):
        print(f"Fixing {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Sửa các lỗi import và function calls
        content = re.sub(r'get_tenant_from_header\(\)', 'CurrentTenantId', content)
        content = re.sub(r'tenant_code: str = get_tenant_from_header\(\),', 'tenant_id: CurrentTenantId,', content)
        content = re.sub(r'tenant_id: int = Depends\(get_tenant_from_header\),', 'tenant_id: CurrentTenantId,', content)
        content = re.sub(r'TenantUser', 'CurrentUser', content)
        content = re.sub(r'get_tenant_from_header', 'CurrentTenantId', content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Fixed {file_path}")
    else:
        print(f"File not found: {file_path}")

print("All files fixed!")