#!/usr/bin/env python3

"""
Simple test to debug authentication endpoint
"""

import requests
import json

def test_auth():
    """Test authentication endpoint"""
    
    url = "https://travel.link360.vn/api/v1/auth/access-token"
    
    # Test data
    data = {
        "username": "admin@travel.link360.vn",
        "password": "SuperSecretPass123"
    }
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    print(f"Testing POST {url}")
    print(f"Data: {data}")
    
    try:
        # Make request
        response = requests.post(url, data=data, headers=headers)
        
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success! Token: {result.get('access_token', 'No token')}")
        else:
            print(f"Error: {response.status_code}")
            try:
                error = response.json()
                print(f"Error details: {error}")
            except:
                print(f"Raw error: {response.text}")
                
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_auth()