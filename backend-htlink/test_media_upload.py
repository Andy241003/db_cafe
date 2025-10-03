#!/usr/bin/env python3
"""
Test script to verify media upload functionality
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
EMAIL = "admin@travel.link360.vn"
PASSWORD = "SuperSecretPass123"

def login():
    """Login and get access token"""
    login_data = {
        "username": EMAIL,
        "password": PASSWORD
    }
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", data=login_data)
    print(f"Login response: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        return token_data["access_token"]
    else:
        print(f"Login failed: {response.text}")
        return None

def test_media_upload(token):
    """Test media upload with a dummy file"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a small test image (1x1 pixel PNG)
    test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00'
    
    files = {
        'file': ('test.png', test_image_data, 'image/png')
    }
    data = {
        'kind': 'image',
        'alt_text': 'Test image'
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/media/upload", headers=headers, files=files, data=data)
    print(f"Upload response: {response.status_code}")
    if response.status_code == 200:
        print(f"Upload successful: {response.json()}")
        return True
    else:
        print(f"Upload failed: {response.text}")
        return False

if __name__ == "__main__":
    print("Testing media upload...")
    token = login()
    if token:
        success = test_media_upload(token)
        if success:
            print("✅ Media upload test PASSED")
        else:
            print("❌ Media upload test FAILED")
    else:
        print("❌ Could not login")