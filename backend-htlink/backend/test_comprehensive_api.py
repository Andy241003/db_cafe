#!/usr/bin/env python3
"""
Extended test script for HotelLink 360 API CRUD operations
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
        self.created_items = []  # Track created items for cleanup
        
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
                
                # Test UPDATE if properties exist
                if properties:
                    prop_id = properties[0]['id']
                    update_data = {"property_name": "Updated Hotel Name"}
                    update_url = f"{API_V1}/properties/{prop_id}"
                    
                    update_response = requests.put(update_url, json=update_data, headers=self.headers)
                    if update_response.status_code == 200:
                        print("✅ UPDATE Property: Success")
                    else:
                        print(f"❌ UPDATE Property failed: {update_response.status_code} - {update_response.text}")
                        
            else:
                print(f"❌ GET Properties failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ GET Properties error: {str(e)}")
            return False
        
        # Test CREATE new property with unique code
        try:
            url = f"{API_V1}/properties/"
            import time
            unique_code = f"test-hotel-{int(time.time())}"
            
            new_property = {
                "tenant_id": 1,
                "property_name": "New API Test Hotel",
                "code": unique_code, 
                "address": "456 New API Street",
                "city": "New Test City",
                "country": "Vietnam",
                "timezone": "Asia/Ho_Chi_Minh",
                "default_locale": "en"
            }
            
            response = requests.post(url, json=new_property, headers=self.headers)
            
            if response.status_code == 200:
                created_property = response.json()
                print(f"✅ CREATE Property: {created_property.get('property_name')}")
                self.created_items.append(('property', created_property['id']))
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
        
        # Test GET
        try:
            url = f"{API_V1}/features/categories"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                categories = response.json()
                print(f"✅ GET Feature Categories: Found {len(categories)} categories")
                for cat in categories[:3]:  # Show first 3
                    print(f"   - {cat.get('slug', 'N/A')} - {cat.get('icon_key', 'N/A')}")
                    
                return categories
            else:
                print(f"❌ GET Feature Categories failed: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ GET Feature Categories error: {str(e)}")
            return []
    
    def test_features_crud(self):
        """Test individual Features CRUD operations"""  
        print("\n⭐ Testing Features CRUD...")
        
        try:
            url = f"{API_V1}/features/"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                features = response.json()
                print(f"✅ GET Features: Found {len(features)} features")
                for feat in features[:5]:  # Show first 5
                    print(f"   - {feat.get('slug', 'N/A')} - {feat.get('icon_key', 'N/A')}")
                return features
            else:
                print(f"❌ GET Features failed: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ GET Features error: {str(e)}")
            return []
    
    def test_posts_crud(self):
        """Test Posts CRUD operations"""
        print("\n📝 Testing Posts CRUD...")
        
        try:
            url = f"{API_V1}/posts/"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                posts = response.json()
                print(f"✅ GET Posts: Found {len(posts)} posts")
                for post in posts[:3]:  # Show first 3
                    print(f"   - {post.get('slug', 'N/A')}")
                return posts
            else:
                print(f"❌ GET Posts failed: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ GET Posts error: {str(e)}")
            return []

    def test_users_crud(self):
        """Test Users CRUD operations"""
        print("\n👥 Testing Users CRUD...")
        
        try:
            url = f"{API_V1}/users/"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                users = response.json()
                print(f"✅ GET Users: Found {len(users)} users")
                for user in users:
                    print(f"   - {user.get('email', 'N/A')} - {user.get('role', 'N/A')}")
                return users
            else:
                print(f"❌ GET Users failed: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ GET Users error: {str(e)}")
            return []
    
    def run_comprehensive_tests(self):
        """Run comprehensive tests across all entities"""
        print("🚀 Starting Comprehensive HotelLink 360 API Tests...")
        
        # Login first
        if not self.login():
            print("❌ Cannot proceed without login")
            return
        
        # Test user info
        user = self.test_user_info()
        if not user:
            print("❌ Cannot proceed without user info")
            return
        
        # Test all CRUD operations
        self.test_properties_crud()
        self.test_feature_categories_crud() 
        self.test_features_crud()
        self.test_posts_crud()
        self.test_users_crud()
        
        print(f"\n📊 Summary: Tested {len(self.created_items)} new items created")
        print("🎉 Comprehensive tests completed!")

if __name__ == "__main__":
    tester = HotelLinkAPITester()
    tester.run_comprehensive_tests()