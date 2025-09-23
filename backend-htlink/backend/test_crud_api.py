#!/usr/bin/env python3
"""
Script to test CRUD operations for HotelLink 360 API
Tests various endpoints systematically with proper authentication
"""
import requests
import json
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"
TENANT_CODE = "demo"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Donghkt123"

class HotelLinkAPITester:
    def __init__(self):
        self.token: Optional[str] = None
        self.headers: Dict[str, str] = {}
        
    def login(self) -> bool:
        """Login and get authentication token"""
        try:
            url = f"{API_V1}/login/access-token"
            headers = {"X-Tenant-Code": TENANT_CODE}
            data = {
                "username": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            response = requests.post(url, data=data, headers=headers)
            
            if response.status_code == 200:
                token_data = response.json()
                self.token = token_data["access_token"]
                self.headers = {
                    "Authorization": f"Bearer {self.token}",
                    "X-Tenant-Code": TENANT_CODE,
                    "Content-Type": "application/json"
                }
                print("✅ Login successful")
                return True
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def test_user_info(self):
        """Test getting current user info"""
        try:
            url = f"{API_V1}/users/me"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"✅ User info: {user_data['email']} - Role: {user_data['role']}")
                return user_data
            else:
                print(f"❌ Get user info failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Get user info error: {str(e)}")
            return None
    
    def test_properties_crud(self):
        """Test Properties CRUD operations"""
        print("\n🏨 Testing Properties CRUD...")
        
        # Test GET (list properties)
        try:
            url = f"{API_V1}/properties/"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                properties = response.json()
                print(f"✅ GET Properties: Found {len(properties)} properties")
                for prop in properties:
                    print(f"   - {prop.get('property_name')} ({prop.get('code')})")
            else:
                print(f"❌ GET Properties failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ GET Properties error: {str(e)}")
            return False
        
        # Test CREATE property
        try:
            url = f"{API_V1}/properties/"
            new_property = {
                "tenant_id": 1,
                "property_name": "API Test Hotel",
                "code": "api-test-hotel", 
                "address": "123 API Test Street",
                "city": "Test City",
                "country": "Vietnam",
                "timezone": "Asia/Ho_Chi_Minh",
                "default_locale": "en"
            }
            
            response = requests.post(url, json=new_property, headers=self.headers)
            
            if response.status_code == 200:
                created_property = response.json()
                print(f"✅ CREATE Property: {created_property.get('property_name')}")
                return created_property
            else:
                print(f"❌ CREATE Property failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ CREATE Property error: {str(e)}")
            return None
    
    def test_feature_categories_crud(self):
        """Test Feature Categories CRUD operations"""
        print("\n📂 Testing Feature Categories CRUD...")
        
        try:
            url = f"{API_V1}/features/categories"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                categories = response.json()
                print(f"✅ GET Feature Categories: Found {len(categories)} categories")
                for cat in categories[:5]:  # Show first 5
                    print(f"   - {cat.get('slug')} - {cat.get('icon_key')}")
                return True
            else:
                print(f"❌ GET Feature Categories failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ GET Feature Categories error: {str(e)}")
            return False
    
    def run_tests(self):
        """Run all tests"""
        print("🚀 Starting HotelLink 360 API Tests...")
        
        # Login first
        if not self.login():
            print("❌ Cannot proceed without login")
            return
        
        # Test user info
        user = self.test_user_info()
        if not user:
            print("❌ Cannot proceed without user info")
            return
        
        # Test Properties CRUD
        self.test_properties_crud()
        
        # Test Feature Categories CRUD  
        self.test_feature_categories_crud()
        
        print("\n🎉 Tests completed!")

if __name__ == "__main__":
    tester = HotelLinkAPITester()
    tester.run_tests()