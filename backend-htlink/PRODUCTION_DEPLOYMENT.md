# 🚀 HotelLink API - Production Deployment Guide

## ✅ What's Included

**Complete Hotel Management System:**
- ✅ **Backend:** FastAPI + MySQL + JWT Authentication + Multi-tenant
- ✅ **Frontend:** React + TypeScript + Vite + Tailwind CSS  
- ✅ **Authentication:** JWT tokens with localStorage integration
- ✅ **Multi-tenant:** Support for multiple hotels/tenants
- ✅ **Role-based Access:** OWNER/ADMIN/EDITOR/VIEWER permissions
- ✅ **API Documentation:** Interactive Swagger UI
- ✅ **Production Ready:** Docker containers with proper configuration

---

## 🖥️ Production Deployment

### For Linux/Ubuntu Server:

```bash
# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/nvdong123/hotel-link/main/backend-htlink/deploy-production.sh -o deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh
```

### For Windows Server:

```powershell
# Download and run deployment script (Run as Administrator)
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/nvdong123/hotel-link/main/backend-htlink/deploy-production.ps1" -OutFile "deploy.ps1"
.\deploy.ps1
```

### Manual Deployment:

```bash
# 1. Clone repository
git clone https://github.com/nvdong123/hotel-link.git
cd hotel-link/backend-htlink

# 2. Create production environment
cp .env.example .env.production
# Edit .env.production with your production values

# 3. Deploy with Docker
docker-compose -f docker-compose.production.yml up -d --build
```

---

## 🌐 Access URLs (After Deployment)

| Service | URL | Description |
|---------|-----|-------------|
| **API Backend** | `http://your-server:8000` | Main API server |
| **API Documentation** | `http://your-server:8000/docs` | Interactive API docs |
| **Token Helper** | `http://your-server:8000/token-helper` | Get tokens for external apps |
| **Health Check** | `http://your-server:8000/health` | Service health status |

---

## 🔐 Default Credentials

```
Username: admin@travel.link360.vn
Password: admin123
Tenant: demo (local) / premier_admin (production)
```

---

## 🧪 Quick Test

### 1. Test API Health:
```bash
curl http://your-server:8000/health
```

### 2. Get Authentication Token:
```bash
curl -X POST "http://your-server:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@travel.link360.vn&password=admin123&tenant_code=demo"
```

### 3. Use Token to Access Protected Endpoint:
```bash
# Replace TOKEN_HERE with actual token from step 2
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://your-server:8000/api/v1/properties/
```

---

## 🔧 External App Integration

### JavaScript Example:
```javascript
// 1. Get token
const response = await fetch('http://your-server:8000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'username=admin@travel.link360.vn&password=admin123&tenant_code=demo'
});
const { access_token } = await response.json();

// 2. Use token for API calls
const apiResponse = await fetch('http://your-server:8000/api/v1/properties/', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const data = await apiResponse.json();
```

### cURL Example:
```bash
# Get token and save to variable
TOKEN=$(curl -s -X POST "http://your-server:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@travel.link360.vn&password=admin123&tenant_code=demo" \
  | jq -r '.access_token')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://your-server:8000/api/v1/properties/
```

---

## 📊 Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | Get authentication token |
| `/api/v1/properties/` | GET | List all properties |
| `/api/v1/property-categories/` | GET | List property categories |
| `/api/v1/features/` | GET | List features |
| `/api/v1/users/` | GET | List users (admin only) |
| `/docs` | GET | API documentation |

---

## 🔒 Security Features

- ✅ **JWT Authentication** with expiration
- ✅ **Role-based Access Control** (OWNER/ADMIN/EDITOR/VIEWER)
- ✅ **Multi-tenant Support** with tenant isolation
- ✅ **CORS Protection** with configurable origins
- ✅ **Input Validation** with Pydantic schemas
- ✅ **SQL Injection Protection** with SQLModel ORM

---

## 🚦 Production Checklist

### ✅ Before Going Live:

- [ ] **Domain Configuration:** Point your domain to server IP
- [ ] **SSL/HTTPS Setup:** Configure reverse proxy (Nginx/Traefik)
- [ ] **Firewall Rules:** Open only necessary ports (80, 443)
- [ ] **Environment Variables:** Update production credentials
- [ ] **Database Backup:** Set up automated MySQL backups
- [ ] **Monitoring:** Configure logging and health monitoring
- [ ] **CORS Origins:** Update allowed origins in .env.production

### ✅ Post-Deployment:

- [ ] **Test all endpoints** via Swagger UI
- [ ] **Verify authentication** works correctly
- [ ] **Check external app integration**
- [ ] **Monitor logs** for any errors
- [ ] **Set up SSL certificate** (Let's Encrypt recommended)

---

## 🆘 Troubleshooting

### Common Issues:

**1. Service won't start:**
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Restart services
docker-compose -f docker-compose.production.yml restart
```

**2. Database connection issues:**
```bash
# Check database status
docker-compose -f docker-compose.production.yml exec db mysql -u root -p

# Reset database
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d
```

**3. Authentication not working:**
- Verify credentials in .env.production
- Check if admin user was created properly
- Ensure JWT secret key is set

**4. CORS errors:**
- Update BACKEND_CORS_ORIGINS in .env.production
- Add your domain to allowed origins

---

## 📞 Support

- **Repository:** https://github.com/nvdong123/hotel-link
- **Issues:** Create GitHub issue for bugs/features
- **Documentation:** Check `/docs` endpoint for API reference

---

## 🎉 Success!

Your HotelLink API is now running in production! 🚀

Visit `http://your-server:8000/docs` to explore the API and start integrating with your applications.

---

## Local dev CORS helper

If you need to allow browser requests from `http://localhost:<port>` to a backend instance without changing production CORS, set the environment variable `ALLOW_LOCALHOST_CORS=true` in your local `.env` or `.env.local` used by docker-compose. This enables a safe localhost-origin regex inside the CORS middleware and only affects the process where the env var is set.

Example `.env.local` (do NOT deploy this to production):

ALLOW_LOCALHOST_CORS=true