#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test GET post 85 to check vr360_url"""
import requests
import json

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

print("[*] Testing GET post 85...")

# Login
print("[1] Logging in...")
response = requests.post(
    f"{API_URL}/auth/login",
    data={
        "username": "admin@botonblue.com",
        "password": "Boton@Admin"
    }
)

if response.status_code != 200:
    print(f"[X] Login failed: {response.status_code}")
    print(response.text)
    exit(1)

token = response.json().get("access_token")
tenant_code = response.json().get("tenant", {}).get("code", "boton_blue")
print(f"[+] Login successful! Tenant: {tenant_code}")

headers = {
    "Authorization": f"Bearer {token}",
    "X-Tenant-Code": tenant_code
}

# Get post 85
print("\n[2] Getting post 85...")
response = requests.get(f"{API_URL}/posts/85", headers=headers)

if response.status_code != 200:
    print(f"[X] Failed to get post: {response.status_code}")
    print(response.text)
    exit(1)

post = response.json()
print("[+] Post retrieved successfully!")
print(f"\nPost data:")
print(json.dumps(post, indent=2, ensure_ascii=False))

# Check vr360_url
print("\n[3] Checking vr360_url field...")
if 'vr360_url' in post:
    vr360_value = post['vr360_url']
    if vr360_value:
        print(f"[SUCCESS] vr360_url EXISTS with value: {vr360_value}")
    else:
        print(f"[WARNING] vr360_url EXISTS but is NULL/empty")
else:
    print("[FAIL] vr360_url field NOT FOUND in response!")
    print(f"Available fields: {list(post.keys())}")

print("\n[*] Test complete!")

