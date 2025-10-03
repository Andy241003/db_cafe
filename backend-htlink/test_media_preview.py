#!/usr/bin/env python3
"""
Test script to verify image preview functionality
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

def test_upload_and_preview(token):
    """Test media upload and preview URL"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a small test image (1x1 pixel PNG)
    test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00'
    
    files = {
        'file': ('test.png', test_image_data, 'image/png')
    }
    data = {
        'kind': 'image',
        'alt_text': 'Test image for preview'
    }
    
    # Test upload
    response = requests.post(f"{BASE_URL}/api/v1/media/upload", headers=headers, files=files, data=data)
    print(f"Upload response: {response.status_code}")
    if response.status_code == 200:
        upload_result = response.json()
        print(f"Upload result: {upload_result}")
        
        # Extract file_key and test preview URL
        file_key = upload_result.get('file_key')
        if file_key:
            preview_url = f"{BASE_URL}/api/v1/media/{file_key}"
            print(f"Testing preview URL: {preview_url}")
            
            # Test if preview URL works
            preview_response = requests.get(preview_url, headers=headers)
            print(f"Preview response: {preview_response.status_code}")
            if preview_response.status_code == 200:
                print(f"✅ Preview works! Content-Type: {preview_response.headers.get('content-type')}")
                print(f"✅ Content size: {len(preview_response.content)} bytes")
                return True
            else:
                print(f"❌ Preview failed: {preview_response.text}")
                return False
        else:
            print("❌ No file_key in upload result")
            return False
    else:
        print(f"Upload failed: {response.text}")
        return False

if __name__ == "__main__":
    print("Testing media upload and preview...")
    token = login()
    if token:
        success = test_upload_and_preview(token)
        if success:
            print("✅ Upload and preview test PASSED")
        else:
            print("❌ Upload and preview test FAILED")
    else:
        print("❌ Could not login")