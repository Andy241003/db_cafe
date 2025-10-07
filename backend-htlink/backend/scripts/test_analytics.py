#!/usr/bin/env python3
"""
Test script for analytics tracking endpoint
"""
import requests
import json
import time
import random
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TRACKING_KEY = "test-tracking-key-123"  # You'll need to create a property with this key

def create_test_property():
    """Create a test property with tracking key"""
    # First login to get auth token
    login_response = requests.post(
        f"{API_BASE_URL}/auth/login",
        data={
            "username": "admin@travel.link360.vn",
            "password": "SuperSecretPass123"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code}")
        return None
    
    token = login_response.json()["access_token"]
    
    # Create property with tracking key (you might need to modify this based on your property creation endpoint)
    print("Note: You need to manually create a property with tracking_key 'test-tracking-key-123' in the database")
    return token

def test_analytics_tracking():
    """Test the analytics tracking endpoint"""
    
    # Sample tracking data
    test_events = [
        {
            "tracking_key": TRACKING_KEY,
            "event_type": "page_view",
            "device": "desktop",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "url": "https://botonblue.trip360.vn/",
            "referrer": "https://google.com/"
        },
        {
            "tracking_key": TRACKING_KEY,
            "event_type": "click",
            "device": "mobile",
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
            "url": "https://botonblue.trip360.vn/features",
            "referrer": "https://botonblue.trip360.vn/"
        },
        {
            "tracking_key": TRACKING_KEY,
            "event_type": "page_view",
            "device": "tablet",
            "user_agent": "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)",
            "url": "https://botonblue.trip360.vn/contact",
            "referrer": "https://botonblue.trip360.vn/features"
        }
    ]
    
    print("Testing Analytics Tracking Endpoint...")
    print("=" * 50)
    
    for i, event_data in enumerate(test_events, 1):
        print(f"\nTest {i}: Tracking {event_data['event_type']} event")
        
        response = requests.post(
            f"{API_BASE_URL}/analytics/track",
            json=event_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Event tracked successfully")
        else:
            print("❌ Failed to track event")
        
        # Wait a bit between requests
        time.sleep(1)

def test_analytics_stats():
    """Test the analytics stats endpoint (requires authentication)"""
    print("\n" + "=" * 50)
    print("Testing Analytics Stats Endpoint...")
    
    # Login first
    login_response = requests.post(
        f"{API_BASE_URL}/auth/login",
        data={
            "username": "admin@travel.link360.vn",
            "password": "SuperSecretPass123"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    token = login_response.json()["access_token"]
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-Code": "boton_blue"
    }
    
    # Test stats endpoint
    print("\nTesting /analytics/stats endpoint")
    stats_response = requests.get(
        f"{API_BASE_URL}/analytics/stats?days=7",
        headers=headers
    )
    
    print(f"Status Code: {stats_response.status_code}")
    if stats_response.status_code == 200:
        print("✅ Stats retrieved successfully")
        print(f"Response: {json.dumps(stats_response.json(), indent=2)}")
    else:
        print("❌ Failed to get stats")
        print(f"Error: {stats_response.text}")
    
    # Test realtime stats
    print("\nTesting /analytics/realtime endpoint")
    realtime_response = requests.get(
        f"{API_BASE_URL}/analytics/realtime",
        headers=headers
    )
    
    print(f"Status Code: {realtime_response.status_code}")
    if realtime_response.status_code == 200:
        print("✅ Realtime stats retrieved successfully")
        print(f"Response: {json.dumps(realtime_response.json(), indent=2)}")
    else:
        print("❌ Failed to get realtime stats")
        print(f"Error: {realtime_response.text}")

def test_test_endpoint():
    """Test the simple test endpoint"""
    print("\nTesting /analytics/test endpoint")
    response = requests.get(f"{API_BASE_URL}/analytics/test")
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✅ Test endpoint working")
        print(f"Response: {response.json()}")
    else:
        print("❌ Test endpoint failed")
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("HotelLink Analytics Testing Script")
    print("=" * 50)
    
    # Test the simple test endpoint first
    test_test_endpoint()
    
    # Test tracking endpoint
    test_analytics_tracking()
    
    # Test stats endpoints
    test_analytics_stats()
    
    print("\n" + "=" * 50)
    print("Testing completed!")
    print("\nNOTE: For tracking tests to work, you need to:")
    print("1. Create a property with tracking_key 'test-tracking-key-123'")
    print("2. Make sure the backend server is running on localhost:8000")