# HotelLink 360 SaaS Backend

## 🏨 Overview

Complete FastAPI backend for a multi-tenant hotel SaaS system with MySQL database. Built from the original MySQL schema with full multi-tenant isolation, role-based access control, and REST API endpoints.

## ✨ Features

- **Multi-tenant Architecture**: Complete tenant isolation across all data
- **Role-based Access Control**: Owner, Admin, Editor, Viewer roles
- **17 Database Tables**: Full hotel domain coverage
- **RESTful API**: Complete CRUD operations for all entities
- **Authentication**: JWT-based with OAuth2
- **Internationalization**: Multi-language support with translation tables
- **Docker Ready**: Full containerization with MySQL
- **Production Ready**: Error monitoring, health checks, CORS

## 🏗️ Database Schema

### Core Tables
- **plans**: Subscription plans with features and pricing
- **tenants**: Multi-tenant isolation with plan assignments
- **admin_users**: User management with role-based access
- **locales**: Internationalization support

### Content Management
- **properties**: Hotel property management
- **feature_categories**: Grouping of features with translations
- **features**: Individual features with translations
- **property_categories**: Property classification
- **property_features**: Feature assignments to properties

### Content & Media
- **posts**: Content management with translations
- **media_files**: File upload and management
- **post_media**: Media associations
- **events**: Event tracking and notifications
- **settings**: Configurable application parameters

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Python 3.10+
- MySQL 8.x

### 1. Environment Setup
```bash
# Clone and navigate
cd hotel-link/

# Environment is already configured in .env
# Update passwords and secrets as needed
```

### 2. Database Setup
```bash
# Start MySQL database
docker-compose up -d db

# Wait for database to be ready
docker-compose logs db
```

### 3. Backend Development
```bash
# Install dependencies
cd backend/
pip install sqlalchemy sqlmodel fastapi uvicorn

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Production Deployment
```bash
# Build and start all services
docker-compose up --build

# Access API documentation
# http://localhost:8000/docs
```

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh

### Core Management
- `GET|POST /api/v1/tenants/` - Tenant management
- `GET|POST|PUT|DELETE /api/v1/users/` - User management
- `GET|POST|PUT|DELETE /api/v1/properties/` - Property management
- `GET /api/v1/plans/` - Subscription plans

### Content Management
- `GET|POST|PUT|DELETE /api/v1/posts/` - Content posts
- `GET|POST|PUT|DELETE /api/v1/features/` - Feature management
- `GET|POST|PUT|DELETE /api/v1/media/` - Media files
- `GET|POST|PUT|DELETE /api/v1/events/` - Event tracking

### Documentation
- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation
- `GET /api/v1/health-check/` - Health status

## 🔐 Security & Authentication

### Role-based Access Control
- **Owner**: Full access to all tenant resources
- **Admin**: Management access, cannot delete tenant
- **Editor**: Create and edit content, limited admin functions
- **Viewer**: Read-only access to content

## 🧪 Testing

```bash
# Test all backend components
python test_backend.py

# Test specific components
cd backend/
python test_components.py
```

## 📈 API Documentation

Full interactive API documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🗄️ Database Models

The system includes 17 fully implemented database tables with proper relationships:

1. **plans** - Subscription plans and pricing
2. **tenants** - Multi-tenant isolation 
3. **locales** - Language support
4. **admin_users** - User management
5. **properties** - Hotel properties
6. **feature_categories** - Feature grouping
7. **feature_category_translations** - Localized categories
8. **features** - Individual features
9. **feature_translations** - Localized features
10. **property_categories** - Property types
11. **property_features** - Property feature assignments
12. **posts** - Content management
13. **post_translations** - Localized content
14. **media_files** - File storage
15. **post_media** - Media associations
16. **events** - System events
17. **settings** - Configuration

## 🔧 Configuration

The system is pre-configured with:
- MySQL 8.x database
- JWT authentication
- Multi-tenant isolation
- Role-based permissions
- CORS for frontend integration
- Health monitoring endpoints

## ✅ Implementation Status

- ✅ **Complete Database Schema**: All 17 tables implemented
- ✅ **SQLAlchemy Models**: Full domain coverage with relationships
- ✅ **Pydantic Schemas**: Request/response validation
- ✅ **CRUD Operations**: Tenant-isolated database operations
- ✅ **API Endpoints**: RESTful endpoints for all entities
- ✅ **Authentication System**: JWT + OAuth2 with roles
- ✅ **Docker Configuration**: Production-ready containerization
- ✅ **Testing**: Component validation and health checks

---

**Complete multi-tenant hotel SaaS backend with MySQL** ✨

Ready for database initialization and frontend integration!