"""
Multi-tenant middleware for HotelLink 360 SaaS
Handles tenant isolation and access control
"""
from typing import Dict, Optional
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlmodel import Session, select

from app.core.db import engine
from app.models import Tenant, AdminUser


class MultiTenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle multi-tenant requests
    """
    
    def __init__(self, app, default_tenant_code: str = "demo"):
        super().__init__(app)
        self.default_tenant_code = default_tenant_code
        self.tenant_cache: Dict[str, Tenant] = {}
    
    async def dispatch(self, request: Request, call_next):
        # Skip middleware for certain paths
        if self._should_skip_tenant_check(request.url.path):
            return await call_next(request)
        
        # Get tenant code from header or use default
        tenant_code = request.headers.get("X-Tenant-Code", self.default_tenant_code)
        
        # Validate and cache tenant
        tenant = self._get_or_cache_tenant(tenant_code)
        if not tenant:
            return self._tenant_not_found_response(tenant_code)
        
        # Check if tenant is active
        if not tenant.is_active:
            return self._tenant_inactive_response(tenant_code)
        
        # Add tenant info to request state
        request.state.tenant = tenant
        request.state.tenant_id = tenant.id
        request.state.tenant_code = tenant.code
        
        return await call_next(request)
    
    def _should_skip_tenant_check(self, path: str) -> bool:
        """
        Paths that don't require tenant validation
        """
        skip_paths = [
            "/docs",
            "/redoc", 
            "/openapi.json",
            "/favicon.ico",
            "/health",
            "/api/v1/auth/access-token",  # Login endpoint
            "/api/v1/utils/",             # Utility endpoints
        ]
        
        return any(path.startswith(skip_path) for skip_path in skip_paths)
    
    def _get_or_cache_tenant(self, tenant_code: str) -> Optional[Tenant]:
        """
        Get tenant from cache or database
        """
        # Check cache first
        if tenant_code in self.tenant_cache:
            return self.tenant_cache[tenant_code]
        
        # Query database
        with Session(engine) as session:
            tenant = session.exec(
                select(Tenant).where(Tenant.code == tenant_code)
            ).first()
            
            if tenant:
                # Cache for future requests (simple in-memory cache)
                self.tenant_cache[tenant_code] = tenant
            
            return tenant
    
    def _tenant_not_found_response(self, tenant_code: str) -> Response:
        """
        Return 404 response for non-existent tenant
        """
        return Response(
            content=f'{{"detail": "Tenant \'{tenant_code}\' not found"}}',
            status_code=404,
            media_type="application/json"
        )
    
    def _tenant_inactive_response(self, tenant_code: str) -> Response:
        """
        Return 403 response for inactive tenant
        """
        return Response(
            content=f'{{"detail": "Tenant \'{tenant_code}\' is inactive"}}',
            status_code=403,
            media_type="application/json"
        )
    
    def clear_tenant_cache(self, tenant_code: Optional[str] = None):
        """
        Clear tenant cache (useful when tenant is updated)
        """
        if tenant_code:
            self.tenant_cache.pop(tenant_code, None)
        else:
            self.tenant_cache.clear()


class TenantAccessControl:
    """
    Helper class for tenant access control in endpoints
    """
    
    @staticmethod
    def check_user_tenant_access(user: AdminUser, tenant_id: int) -> bool:
        """
        Check if user has access to the specified tenant
        """
        # OWNER role can access any tenant
        if user.role == "OWNER":
            return True
        
        # Other roles can only access their own tenant
        return user.tenant_id == tenant_id
    
    @staticmethod
    def filter_by_tenant(query, tenant_id: int):
        """
        Add tenant filter to SQLModel query
        """
        return query.where(query.column_descriptions[0]['entity'].tenant_id == tenant_id)
    
    @staticmethod
    def get_tenant_from_request(request: Request) -> Tenant:
        """
        Get tenant from request state (set by middleware)
        """
        if not hasattr(request.state, 'tenant'):
            raise HTTPException(status_code=500, detail="Tenant not found in request state")
        return request.state.tenant