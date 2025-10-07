import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.requests import Request
from starlette.responses import Response, HTMLResponse

from app.api.main import api_router
from app.core.config import settings


def custom_generate_unique_id(route: APIRoute) -> str:
    if route.tags:
        return f"{route.tags[0]}-{route.name}"
    return route.name


class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    """Handle proxy headers for HTTPS termination"""
    
    async def dispatch(self, request: Request, call_next):
        # Handle X-Forwarded-Proto header from nginx
        forwarded_proto = request.headers.get("X-Forwarded-Proto")
        if forwarded_proto == "https":
            # Override the request scheme to HTTPS
            request.scope["scheme"] = "https"
            
            # Also set the server port to 443 for proper URL generation
            if "server" in request.scope:
                server_host, _ = request.scope["server"]
                request.scope["server"] = (server_host, 443)
        
        response = await call_next(request)
        return response


class AutoTenantMiddleware(BaseHTTPMiddleware):
    """Auto-add tenant header for Swagger UI and API docs"""
    
    async def dispatch(self, request: Request, call_next):
        # Add default tenant header if not present (for API docs testing)
        if not request.headers.get("X-Tenant-Code"):
            # For API docs, default to boton_blue since that's what we're testing
            tenant_code = "boton_blue"
            
            # Create new headers dict with tenant code
            headers = dict(request.headers)
            headers["X-Tenant-Code"] = tenant_code
            
            # Rebuild request with new headers
            request._headers.raw.append((b"x-tenant-code", tenant_code.encode()))
            
            print(f"🔧 AutoTenantMiddleware: Set tenant_code = {tenant_code}")
        
        response = await call_next(request)
        return response


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",  # /api/v1/openapi.json
    docs_url=f"{settings.API_V1_STR}/docs",             # Back to default docs
    redoc_url=f"{settings.API_V1_STR}/redoc",           # /api/v1/redoc
    generate_unique_id_function=custom_generate_unique_id,
    swagger_ui_oauth2_redirect_url=f"{settings.API_V1_STR}/docs/oauth2-redirect",
    swagger_ui_parameters={
        "defaultModelsExpandDepth": -1,
        "syntaxHighlight.theme": "arta",
        "tryItOutEnabled": True,
    }
)

# Set max file size to 100MB
app.router.max_request_size = 100 * 1024 * 1024  # 100MB in bytes


# Add proxy headers middleware to handle HTTPS termination

# Add auto-tenant middleware for API docs
# Set all CORS enabled origins - Always allow for development
"""
Configure CORS origins from settings. The config exposes `all_cors_origins` which
combines BACKEND_CORS_ORIGINS and FRONTEND_HOST. For local development we allow
the common localhost ports. If nothing is configured, fall back to the
production hostnames commonly used by this project so frontends like
https://travel.link360.vn and https://botonblue.trip360.vn are allowed.
"""

# Use configured origins when available
default_dev_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

configured_origins = []
try:
    configured_origins = getattr(settings, "all_cors_origins", []) or []
except Exception:
    configured_origins = []

if configured_origins:
    allowed_origins = configured_origins
else:
    # If running locally, fall back to the common local dev origins
    if getattr(settings, "ENVIRONMENT", "local") == "local":
        allowed_origins = default_dev_origins
    else:
        # Minimal safe fallback for production deployments used by this project
        allowed_origins = [
            "https://travel.link360.vn",
            "https://botonblue.trip360.vn",
        ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add proxy headers middleware to handle HTTPS termination
app.add_middleware(ProxyHeadersMiddleware)

# Add auto-tenant middleware for API docs
app.add_middleware(AutoTenantMiddleware)

app.include_router(api_router)

# Mount static files
try:
    app.mount("/static", StaticFiles(directory="app/static"), name="static")
except:
    pass  # Directory might not exist in some deployments


@app.get("/token-helper", response_class=HTMLResponse)
async def token_helper():
    """Token helper page with auto token storage"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Token Helper - HotelLink API</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
            .btn:hover { background: #0056b3; }
            .success { color: green; }
            .token-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; word-break: break-all; }
        </style>
    </head>
    <body>
        <h1>🔐 HotelLink API - Token Helper</h1>
        
        <div>
            <button class="btn" onclick="getToken()">Get New Token</button>
            <button class="btn" onclick="showToken()">Show Current Token</button>
            <button class="btn" onclick="clearToken()">Clear Token</button>
            <button class="btn" onclick="goToDocs()">Go to API Docs</button>
        </div>
        
        <div id="status" class="token-box">
            <strong>Status:</strong> <span id="tokenStatus">Ready</span>
        </div>
        
        <div id="tokenDisplay" class="token-box" style="display:none;">
            <strong>Current Token:</strong><br>
            <code id="tokenValue"></code>
        </div>
        
        <h3>Instructions:</h3>
        <ol>
            <li>Click "Get New Token" to fetch a fresh token</li>
            <li>Or go to API Docs and use "Authorize" button</li>
            <li>Token will be automatically saved to localStorage</li>
            <li>External apps can access via: <code>localStorage.getItem('access_token')</code></li>
        </ol>
        
        <script>
            async function getToken() {
                try {
                    document.getElementById('tokenStatus').innerHTML = 'Getting token...';
                    
                    const formData = new FormData();
                    formData.append('username', 'admin@travel.link360.vn');
                    formData.append('password', 'admin123');
                    formData.append('tenant_code', 'demo');
                    
                    const response = await fetch('/api/v1/auth/login', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.setItem('token_type', data.token_type);
                        
                        document.getElementById('tokenStatus').innerHTML = '<span class="success">✅ Token obtained and saved!</span>';
                        showToken();
                    } else {
                        document.getElementById('tokenStatus').innerHTML = '❌ Failed to get token';
                    }
                } catch (error) {
                    document.getElementById('tokenStatus').innerHTML = '❌ Error: ' + error.message;
                }
            }
            
            function showToken() {
                const token = localStorage.getItem('access_token');
                const tokenDisplay = document.getElementById('tokenDisplay');
                const tokenValue = document.getElementById('tokenValue');
                
                if (token) {
                    tokenValue.textContent = token;
                    tokenDisplay.style.display = 'block';
                    document.getElementById('tokenStatus').innerHTML = '<span class="success">✅ Token found in localStorage</span>';
                } else {
                    tokenDisplay.style.display = 'none';
                    document.getElementById('tokenStatus').innerHTML = '❌ No token found';
                }
            }
            
            function clearToken() {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token_type');
                document.getElementById('tokenDisplay').style.display = 'none';
                document.getElementById('tokenStatus').innerHTML = 'Token cleared';
            }
            
            function goToDocs() {
                window.open('/api/v1/docs', '_blank');
            }
            
            // Check token on page load
            showToken();
            
            // Override fetch globally to catch tokens from Swagger UI
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    const url = args[0];
                    if (url && url.includes('/auth/login') && response.ok) {
                        response.clone().json().then(data => {
                            if (data.access_token) {
                                localStorage.setItem('access_token', data.access_token);
                                localStorage.setItem('token_type', data.token_type || 'bearer');
                                console.log('✅ Token auto-saved from API call');
                            }
                        }).catch(() => {});
                    }
                    return response;
                });
            };
        </script>
    </body>
    </html>
    """


@app.get("/token-storage", response_class=HTMLResponse)
async def token_storage():
    """Token storage helper page for external apps"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Token Storage - HotelLink API</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .token-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .success { color: green; }
            .error { color: red; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <h1>🔐 HotelLink API - Token Storage</h1>
        <p>This page helps external applications get authentication tokens.</p>
        
        <div id="tokenInfo" class="token-box">
            <strong>Current Token Status:</strong> <span id="tokenStatus">Checking...</span>
        </div>
        
        <button onclick="getNewToken()">Get New Token</button>
        <button onclick="clearToken()">Clear Token</button>
        
        <h3>For External Applications:</h3>
        <div class="token-box">
            <p><strong>JavaScript:</strong></p>
            <code>
                const token = localStorage.getItem('access_token');<br>
                const tokenType = localStorage.getItem('token_type');
            </code>
        </div>
        
        <div class="token-box">
            <p><strong>API Usage:</strong></p>
            <code>
                fetch('/api/v1/some-endpoint', {<br>
                &nbsp;&nbsp;headers: { 'Authorization': `Bearer ${token}` }<br>
                })
            </code>
        </div>
        
        <script>
            function checkToken() {
                const token = localStorage.getItem('access_token');
                const tokenStatus = document.getElementById('tokenStatus');
                
                if (token) {
                    tokenStatus.innerHTML = '<span class="success">✓ Token Available</span>';
                    tokenStatus.innerHTML += '<br><small>Token: ' + token.substring(0, 50) + '...</small>';
                } else {
                    tokenStatus.innerHTML = '<span class="error">✗ No Token Found</span>';
                }
            }
            
            async function getNewToken() {
                try {
                    const response = await fetch('/api/v1/auth/login');
                    const data = await response.json();
                    
                    if (data.access_token) {
                        localStorage.setItem('access_token', data.access_token);
                        localStorage.setItem('token_type', data.token_type);
                        alert('✓ Token saved successfully!');
                        checkToken();
                    }
                } catch (error) {
                    alert('✗ Error getting token: ' + error.message);
                }
            }
            
            function clearToken() {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token_type');
                alert('Token cleared');
                checkToken();
            }
            
            // Check token on page load
            checkToken();
            
            // Auto-refresh token info every 5 seconds
            setInterval(checkToken, 5000);
        </script>
    </body>
    </html>
    """


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "HotelLink 360 API"}


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "HotelLink 360 SaaS API", 
        "version": "1.0.0",
        "docs": "/docs",
        "token_helper": "/token-storage"
    }
