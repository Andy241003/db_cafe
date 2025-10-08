"""
Test script for Property Translation API endpoints
Run this script to test all CRUD operations for property translations
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
# You need to replace this with a valid JWT token from your login
TOKEN = "YOUR_JWT_TOKEN_HERE"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")
    print(f"{'='*60}\n")

def test_get_all_translations():
    """Test GET /api/v1/translations/properties"""
    print("\n📋 TEST 1: Get All Property Translations")
    response = requests.get(
        f"{BASE_URL}/translations/properties",
        headers=headers
    )
    print_response("GET All Property Translations", response)
    return response

def test_create_translation(property_id=1):
    """Test POST /api/v1/translations/properties"""
    print("\n✨ TEST 2: Create Property Translation")
    
    data = {
        "property_id": property_id,
        "locale": "vi",
        "property_name": "Khách sạn Grand Test",
        "slogan": "Ngôi nhà thứ hai của bạn",
        "description": "Một khách sạn sang trọng với đầy đủ tiện nghi hiện đại",
        "address": "123 Đường Chính",
        "district": "Quận 1",
        "city": "Hồ Chí Minh",
        "country": "Việt Nam",
        "copyright_text": "© 2024 Khách sạn Grand"
    }
    
    response = requests.post(
        f"{BASE_URL}/translations/properties",
        headers=headers,
        json=data
    )
    print_response("POST Create Property Translation", response)
    return response

def test_get_translation(property_id=1, locale="vi"):
    """Test GET /api/v1/translations/properties/{property_id}/{locale}"""
    print(f"\n🔎 TEST 3: Get Property Translation (property_id={property_id}, locale={locale})")
    
    response = requests.get(
        f"{BASE_URL}/translations/properties/{property_id}/{locale}",
        headers=headers
    )
    print_response(f"GET Property Translation ({property_id}/{locale})", response)
    return response

def test_update_translation(property_id=1, locale="vi"):
    """Test PUT /api/v1/translations/properties/{property_id}/{locale}"""
    print(f"\n✏️ TEST 4: Update Property Translation (property_id={property_id}, locale={locale})")
    
    data = {
        "property_name": "Khách sạn Grand (Đã cập nhật)",
        "slogan": "Trải nghiệm tuyệt vời nhất",
        "description": "Khách sạn 5 sao với dịch vụ đẳng cấp quốc tế"
    }
    
    response = requests.put(
        f"{BASE_URL}/translations/properties/{property_id}/{locale}",
        headers=headers,
        json=data
    )
    print_response(f"PUT Update Property Translation ({property_id}/{locale})", response)
    return response

def test_delete_translation(property_id=1, locale="vi"):
    """Test DELETE /api/v1/translations/properties/{property_id}/{locale}"""
    print(f"\n🗑️ TEST 5: Delete Property Translation (property_id={property_id}, locale={locale})")
    
    response = requests.delete(
        f"{BASE_URL}/translations/properties/{property_id}/{locale}",
        headers=headers
    )
    print_response(f"DELETE Property Translation ({property_id}/{locale})", response)
    return response

def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*60)
    print("🚀 Starting Property Translation API Tests")
    print("="*60)
    
    # Check if token is set
    if TOKEN == "YOUR_JWT_TOKEN_HERE":
        print("\n❌ ERROR: Please set a valid JWT token in the TOKEN variable")
        print("   You can get a token by logging in at http://localhost:8000/docs")
        print("   Then click 'Authorize' and login with your credentials")
        return
    
    try:
        # Test 1: Get all translations (should be empty initially)
        test_get_all_translations()
        
        # Test 2: Create a new translation
        create_response = test_create_translation(property_id=1)
        
        if create_response.status_code == 200:
            # Test 3: Get the created translation
            test_get_translation(property_id=1, locale="vi")
            
            # Test 4: Update the translation
            test_update_translation(property_id=1, locale="vi")
            
            # Test 5: Get again to verify update
            test_get_translation(property_id=1, locale="vi")
            
            # Test 6: Delete the translation
            test_delete_translation(property_id=1, locale="vi")
            
            # Test 7: Try to get deleted translation (should fail)
            test_get_translation(property_id=1, locale="vi")
        else:
            print("\n⚠️ Skipping remaining tests due to creation failure")
            print("   Make sure property_id=1 exists in your database")
        
        print("\n" + "="*60)
        print("✅ All tests completed!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to backend at http://localhost:8000")
        print("   Make sure the backend is running: docker-compose up -d backend")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Quick test without full sequence
    print("\n" + "="*60)
    print("🔧 Quick API Check")
    print("="*60)
    
    # Test if API is accessible
    try:
        response = requests.get(f"{BASE_URL}/translations/properties", headers=headers)
        if response.status_code == 401:
            print("\n⚠️ Authentication required!")
            print("   Please update the TOKEN variable with a valid JWT token")
            print("\n📝 How to get a token:")
            print("   1. Go to http://localhost:8000/docs")
            print("   2. Click 'Authorize' button")
            print("   3. Login with your credentials")
            print("   4. Copy the token from the response")
            print("   5. Update TOKEN variable in this script")
        elif response.status_code == 200:
            print("\n✅ API is accessible!")
            print(f"   Found {len(response.json())} property translations")
            
            # Run full test suite
            run_all_tests()
        else:
            print(f"\n⚠️ Unexpected status code: {response.status_code}")
            print(f"   Response: {response.text}")
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to backend at http://localhost:8000")
        print("   Make sure the backend is running:")
        print("   cd backend-htlink")
        print("   docker-compose up -d backend")

