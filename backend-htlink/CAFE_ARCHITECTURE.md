# Cafe System Architecture

## Multi-tenancy Model

The Cafe system uses a **simplified 2-level hierarchy**:

```
Tenant (Organization)
    └── User Accounts
```

### Key Differences from VR Hotel:

| Feature | VR Hotel | Cafe |
|---------|----------|------|
| **Hierarchy** | Tenant → Property → User | Tenant → User |
| **API Headers** | X-Tenant-Code, X-Property-Id | X-Tenant-Code only |
| **Use Case** | Multiple hotel properties | Single cafe brand |
| **Data Scope** | Property-specific (rooms, facilities) | Tenant-wide (branches, menu) |

## Authentication Flow

### Login
```
POST /api/v1/login/access-token
Response:
{
  "access_token": "...",
  "token_type": "bearer",
  "tenant_code": "demo"
}

Store in localStorage:
  - access_token
  - tenant_code
```

### API Requests
```typescript
// All Cafe API calls include:
headers: {
  Authorization: `Bearer ${token}`,
  'X-Tenant-Code': `${tenantCode}`
}

// No X-Property-Id needed for Cafe
```

## Database Schema

All cafe tables use **tenant_id** for data isolation:

```sql
-- Cafe Settings (one per tenant)
CREATE TABLE cafe_settings (
  id INT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,  -- Links to tenant
  cafe_name VARCHAR(255),
  primary_color VARCHAR(20),
  ...
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Cafe Branches (multiple per tenant)
CREATE TABLE cafe_branches (
  id INT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,  -- All belong to same tenant
  name_vi VARCHAR(255),
  address_vi TEXT,
  ...
);

-- Menu Categories (shared across all branches)
CREATE TABLE cafe_menu_categories (
  id INT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  name_vi VARCHAR(255),
  display_order INT,
  ...
);
```

## API Endpoint Pattern

### Backend (FastAPI)
```python
@router.get("/cafe/branches")
def get_branches(
    current_user: CurrentUser,  # From JWT token
    db: SessionDep
):
    # Filter by tenant_id from current_user
    statement = select(CafeBranch).where(
        CafeBranch.tenant_id == current_user.tenant_id
    )
    return db.exec(statement).all()
```

### Frontend (React)
```typescript
// cafeApi.ts automatically adds tenant header
export const cafeBranchesApi = {
  getBranches: async (): Promise<Branch[]> => {
    const response = await cafeClient.get('/cafe/branches');
    // X-Tenant-Code header added by interceptor
    return response.data;
  }
};
```

## Benefits of Tenant-Only Model

1. **Simpler Architecture**: No property context switching
2. **Unified Data**: All branches share same menu, events, promotions
3. **Easier Management**: Single admin panel per cafe brand
4. **Consistent Branding**: One settings applies to all branches
5. **Shared Resources**: Media library, menu items, careers across locations

## Example: Menu Management

```
Tenant: "Downtown Coffee"
  ├── Settings (logo, colors, SEO)
  ├── Branches
  │   ├── District 1 Branch
  │   ├── District 3 Branch
  │   └── District 7 Branch
  ├── Menu (shared by all branches)
  │   ├── Hot Coffee Category
  │   │   ├── Espresso
  │   │   ├── Cappuccino
  │   │   └── Latte
  │   └── Cold Drinks Category
  ├── Events (apply to all branches)
  ├── Careers (hiring for any location)
  └── Promotions (valid at all branches)
```

## Migration from Property-Based System

If converting from property-based code:

1. **Remove property_id** from:
   - localStorage access
   - API request headers
   - Database queries

2. **Use tenant_id** instead:
   - All queries: `WHERE tenant_id = current_user.tenant_id`
   - All inserts: Include `tenant_id` from auth user
   - No need for property selection UI

3. **Update API interceptors**:
   ```typescript
   // Before (VR Hotel)
   config.headers['X-Property-Id'] = propertyId;
   
   // After (Cafe)
   // Remove property header - only use X-Tenant-Code
   ```

## Security & Data Isolation

- **Row-Level Security**: All queries filtered by `tenant_id`
- **Authentication**: JWT token contains user + tenant info
- **Authorization**: Backend validates user belongs to tenant
- **No Cross-Tenant Access**: Impossible to access other tenants' data

## Summary

The Cafe system is **tenant-scoped**, not property-scoped:
- ✅ One tenant = One cafe brand
- ✅ Multiple branches under same brand
- ✅ Shared menu, events, promotions
- ✅ Single admin interface
- ❌ No property concepts
- ❌ No property switching
- ❌ No X-Property-Id header
