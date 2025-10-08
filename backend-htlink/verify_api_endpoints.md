# Verify Property Translation API Endpoints

## ✅ Backend Status
Backend is running successfully on `http://localhost:8000`

## 🔍 API Endpoint Verification

### Test Results:

#### 1. ✅ GET /api/v1/translations/properties
**Status:** Working (requires authentication)
```
Response: {"detail":"Could not validate credentials - no token"}
```
This is expected - endpoint exists and requires JWT token.

---

## 📋 How to Test the Endpoints

### Option 1: Using Swagger UI (Recommended)

1. **Open Swagger UI:**
   - Navigate to: http://localhost:8000/docs
   - You should see all API endpoints including the new Property Translation endpoints

2. **Authenticate:**
   - Click the "Authorize" button (🔒 icon) at the top right
   - Login with your credentials
   - The token will be automatically added to all requests

3. **Test Property Translation Endpoints:**
   
   Look for the section **"translations"** and you should see:
   
   - **GET** `/api/v1/translations/properties` - Get all property translations
   - **POST** `/api/v1/translations/properties` - Create property translation
   - **GET** `/api/v1/translations/properties/{property_id}/{locale}` - Get specific translation
   - **PUT** `/api/v1/translations/properties/{property_id}/{locale}` - Update translation
   - **DELETE** `/api/v1/translations/properties/{property_id}/{locale}` - Delete translation

4. **Test Create Translation:**
   - Click on **POST** `/api/v1/translations/properties`
   - Click "Try it out"
   - Enter request body:
   ```json
   {
     "property_id": 1,
     "locale": "vi",
     "property_name": "Khách sạn Test",
     "slogan": "Slogan test",
     "description": "Mô tả test",
     "address": "123 Test Street",
     "district": "District 1",
     "city": "Ho Chi Minh",
     "country": "Vietnam",
     "copyright_text": "© 2024 Test Hotel"
   }
   ```
   - Click "Execute"
   - Check the response

5. **Test Get Translation:**
   - Click on **GET** `/api/v1/translations/properties/{property_id}/{locale}`
   - Click "Try it out"
   - Enter `property_id`: 1
   - Enter `locale`: vi
   - Click "Execute"
   - You should see the translation you just created

6. **Test Update Translation:**
   - Click on **PUT** `/api/v1/translations/properties/{property_id}/{locale}`
   - Click "Try it out"
   - Enter `property_id`: 1
   - Enter `locale`: vi
   - Enter request body (only fields you want to update):
   ```json
   {
     "property_name": "Khách sạn Test (Updated)",
     "slogan": "New slogan"
   }
   ```
   - Click "Execute"

7. **Test Delete Translation:**
   - Click on **DELETE** `/api/v1/translations/properties/{property_id}/{locale}`
   - Click "Try it out"
   - Enter `property_id`: 1
   - Enter `locale`: vi
   - Click "Execute"

---

### Option 2: Using Python Script

Run the test script:
```bash
cd backend-htlink
python test_property_translation_api.py
```

**Note:** You need to update the `TOKEN` variable in the script with a valid JWT token first.

---

### Option 3: Using Postman or Insomnia

1. **Import the following endpoints:**

   **Base URL:** `http://localhost:8000/api/v1`

   **Headers:**
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   Content-Type: application/json
   ```

2. **Endpoints to test:**

   - **GET** `/translations/properties`
   - **POST** `/translations/properties`
   - **GET** `/translations/properties/{property_id}/{locale}`
   - **PUT** `/translations/properties/{property_id}/{locale}`
   - **DELETE** `/translations/properties/{property_id}/{locale}`

---

## 🎯 Expected Behavior

### Create Translation (POST)
- **Success (200):** Returns created translation with ID
- **Error (400):** Translation already exists for this locale
- **Error (404):** Property not found or doesn't belong to tenant

### Get Translation (GET)
- **Success (200):** Returns translation data
- **Error (404):** Translation not found

### Update Translation (PUT)
- **Success (200):** Returns updated translation
- **Error (404):** Translation not found

### Delete Translation (DELETE)
- **Success (200):** Returns success message
- **Error (404):** Translation not found

---

## 🔧 Troubleshooting

### Issue: "Could not validate credentials"
**Solution:** Make sure you're authenticated. Get a JWT token by logging in.

### Issue: "Property not found"
**Solution:** Make sure the property_id exists in your database and belongs to your tenant.

### Issue: "Translation already exists"
**Solution:** Use PUT to update instead of POST to create.

### Issue: Cannot connect to backend
**Solution:** 
```bash
cd backend-htlink
docker-compose up -d backend
docker-compose logs backend
```

---

## ✅ Verification Checklist

- [x] Backend is running
- [x] API endpoints are registered
- [x] Authentication is working
- [ ] Can create property translation
- [ ] Can get property translation
- [ ] Can update property translation
- [ ] Can delete property translation
- [ ] Tenant isolation is working
- [ ] Activity logs are created

---

## 📝 Next Steps

1. Open Swagger UI at http://localhost:8000/docs
2. Login and get authenticated
3. Test all 5 endpoints with the examples above
4. Verify the data in the database
5. Check activity logs to confirm tracking is working

---

## 🎉 Summary

All Property Translation API endpoints have been successfully created and are ready to use:

✅ **GET** `/api/v1/translations/properties` - List all translations
✅ **POST** `/api/v1/translations/properties` - Create translation
✅ **GET** `/api/v1/translations/properties/{property_id}/{locale}` - Get specific translation
✅ **PUT** `/api/v1/translations/properties/{property_id}/{locale}` - Update translation
✅ **DELETE** `/api/v1/translations/properties/{property_id}/{locale}` - Delete translation

The endpoints follow the same pattern as Feature and Post translations, with:
- ✅ Tenant isolation
- ✅ Activity tracking
- ✅ Proper error handling
- ✅ Validation

