"""
Quick test for translation API endpoint with DeepL
"""
import requests
import json

# Test data
url = "http://localhost:8000/api/v1/translations/translate"
data = {
    "texts": [
        "Welcome to our luxury hotel! Check-in is at 2 PM.",
        "Our deluxe suite features ocean view and complimentary breakfast.",
        "Enjoy our spa, fitness center, and room service amenities."
    ],
    "target": "vi",
    "source": "en",
    "is_html": False,
    "apply_glossary": True,
    "prefer_deepl": True
}

print("=" * 80)
print("🧪 Testing Translation API Endpoint")
print("=" * 80)
print(f"\n📤 Request URL: {url}")
print(f"📝 Translating {len(data['texts'])} texts to Vietnamese...")
print()

for i, text in enumerate(data['texts'], 1):
    print(f"{i}. EN: {text}")

print("\n⏳ Sending request...\n")

try:
    response = requests.post(url, json=data)
    
    if response.status_code == 200:
        results = response.json()
        
        print("=" * 80)
        print("✅ Translation Successful!")
        print("=" * 80)
        
        for i, (original, translated) in enumerate(zip(data['texts'], results), 1):
            print(f"\n{i}. EN: {original}")
            print(f"   VI: {translated}")
        
        print("\n" + "=" * 80)
        print("🎉 All translations completed successfully!")
        print("=" * 80)
        print("\n💡 DeepL API is working correctly!")
        
    else:
        print(f"❌ Error: HTTP {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Request failed: {e}")
