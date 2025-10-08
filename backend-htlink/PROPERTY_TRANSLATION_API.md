# Property Translation API Documentation

## Overview
API endpoints for managing property translations in the HotelLink 360 system.

## Database Schema
```sql
CREATE TABLE `property_translation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `property_id` bigint NOT NULL,
  `locale` varchar(10) NOT NULL,
  `property_name` varchar(255) DEFAULT NULL,
  `slogan` varchar(255) DEFAULT NULL,
  `description` text,
  `address` varchar(255) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `copyright_text` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `property_id` (`property_id`,`locale`),
  CONSTRAINT `fk_property_translation_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## API Endpoints

### 1. Get All Property Translations
**GET** `/api/v1/translations/properties`

Retrieve all property translations for properties belonging to the current tenant.

**Query Parameters:**
- `skip` (int, optional): Number of records to skip (default: 0)
- `limit` (int, optional): Maximum number of records to return (default: 100)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "property_id": 1,
    "locale": "en",
    "property_name": "Grand Hotel",
    "slogan": "Your home away from home",
    "description": "A luxurious hotel...",
    "address": "123 Main St",
    "district": "Downtown",
    "city": "New York",
    "country": "USA",
    "copyright_text": "© 2024 Grand Hotel",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2. Create Property Translation
**POST** `/api/v1/translations/properties`

Create a new translation for a property.

**Request Body:**
```json
{
  "property_id": 1,
  "locale": "vi",
  "property_name": "Khách sạn Grand",
  "slogan": "Ngôi nhà thứ hai của bạn",
  "description": "Một khách sạn sang trọng...",
  "address": "123 Đường Chính",
  "district": "Trung tâm",
  "city": "Hà Nội",
  "country": "Việt Nam",
  "copyright_text": "© 2024 Khách sạn Grand"
}
```

**Response:** `200 OK`
```json
{
  "id": 2,
  "property_id": 1,
  "locale": "vi",
  "property_name": "Khách sạn Grand",
  "slogan": "Ngôi nhà thứ hai của bạn",
  "description": "Một khách sạn sang trọng...",
  "address": "123 Đường Chính",
  "district": "Trung tâm",
  "city": "Hà Nội",
  "country": "Việt Nam",
  "copyright_text": "© 2024 Khách sạn Grand",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Translation for this locale already exists
- `404 Not Found`: Property not found or doesn't belong to tenant

---

### 3. Get Property Translation by Locale
**GET** `/api/v1/translations/properties/{property_id}/{locale}`

Get a specific translation for a property.

**Path Parameters:**
- `property_id` (int): Property ID
- `locale` (string): Locale code (e.g., "en", "vi", "ja")

**Response:** `200 OK`
```json
{
  "id": 1,
  "property_id": 1,
  "locale": "en",
  "property_name": "Grand Hotel",
  "slogan": "Your home away from home",
  "description": "A luxurious hotel...",
  "address": "123 Main St",
  "district": "Downtown",
  "city": "New York",
  "country": "USA",
  "copyright_text": "© 2024 Grand Hotel",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Property or translation not found

---

### 4. Update Property Translation
**PUT** `/api/v1/translations/properties/{property_id}/{locale}`

Update an existing property translation.

**Path Parameters:**
- `property_id` (int): Property ID
- `locale` (string): Locale code

**Request Body:**
```json
{
  "property_name": "Updated Hotel Name",
  "slogan": "Updated slogan",
  "description": "Updated description...",
  "address": "Updated address",
  "district": "Updated district",
  "city": "Updated city",
  "country": "Updated country",
  "copyright_text": "© 2024 Updated Hotel"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Response:** `200 OK`
```json
{
  "id": 1,
  "property_id": 1,
  "locale": "en",
  "property_name": "Updated Hotel Name",
  "slogan": "Updated slogan",
  "description": "Updated description...",
  "address": "Updated address",
  "district": "Updated district",
  "city": "Updated city",
  "country": "Updated country",
  "copyright_text": "© 2024 Updated Hotel",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Property or translation not found

---

### 5. Delete Property Translation
**DELETE** `/api/v1/translations/properties/{property_id}/{locale}`

Delete a property translation.

**Path Parameters:**
- `property_id` (int): Property ID
- `locale` (string): Locale code

**Response:** `200 OK`
```json
{
  "message": "Property translation deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Property or translation not found

---

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Permissions
- All endpoints require the user to be authenticated
- Users can only access translations for properties in their tenant
- Activity logs are automatically created for create, update, and delete operations

## Example Usage

### Using cURL

**Create a translation:**
```bash
curl -X POST "http://localhost:8000/api/v1/translations/properties" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": 1,
    "locale": "vi",
    "property_name": "Khách sạn Grand",
    "slogan": "Ngôi nhà thứ hai của bạn"
  }'
```

**Get a translation:**
```bash
curl -X GET "http://localhost:8000/api/v1/translations/properties/1/vi" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update a translation:**
```bash
curl -X PUT "http://localhost:8000/api/v1/translations/properties/1/vi" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "property_name": "Khách sạn Grand (Updated)"
  }'
```

**Delete a translation:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/translations/properties/1/vi" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Files Modified/Created

### Models
- `backend/app/models/__init__.py` - Added `PropertyTranslation` model

### Schemas
- `backend/app/schemas/core.py` - Added translation schemas:
  - `PropertyTranslationBase`
  - `PropertyTranslationCreate`
  - `PropertyTranslationUpdate`
  - `PropertyTranslationResponse`

### CRUD Operations
- `backend/app/crud/crud_content.py` - Added `CRUDPropertyTranslation` class with methods:
  - `get_by_property_and_locale()`
  - `get_by_property()`
  - `create_translation()`
  - `update_translation()`
  - `delete_translation()`

### API Endpoints
- `backend/app/api/v1/endpoints/translations.py` - Added 5 endpoints:
  - GET `/properties` - List all translations
  - POST `/properties` - Create translation
  - GET `/properties/{property_id}/{locale}` - Get specific translation
  - PUT `/properties/{property_id}/{locale}` - Update translation
  - DELETE `/properties/{property_id}/{locale}` - Delete translation

## Next Steps

1. **Rebuild Backend:**
   ```bash
   cd backend-htlink
   docker-compose build backend
   docker-compose up -d backend
   ```

2. **Test the API:**
   - Use the Swagger UI at `http://localhost:8000/docs`
   - Or use the cURL examples above

3. **Frontend Integration:**
   - Create API service functions in `frontend/src/services/api.ts`
   - Add UI components for managing property translations

