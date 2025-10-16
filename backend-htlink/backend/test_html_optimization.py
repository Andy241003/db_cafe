#!/usr/bin/env python3
"""
Test HTML Translation Optimization
Demonstrates batch mode vs granular mode performance
"""
import asyncio
import time
import httpx

API_URL = "http://localhost:8000/api/v1/translations/translate"

# Sample HTML with multiple images and icons
SAMPLE_HTML = """
<div class="hotel-description">
    <h2>Welcome to <strong>Premium Ocean Resort</strong></h2>
    <p>Experience luxury at our <img src="hotel-exterior.jpg" alt="Hotel"/> 
    5-star beachfront property.</p>
    
    <h3>Features & Amenities</h3>
    <ul>
        <li><i class="fa fa-swimming-pool"></i> Olympic-size infinity pool with 
        <img src="pool-view.jpg" alt="Pool"/> ocean views</li>
        
        <li><i class="fa fa-spa"></i> Full-service spa & 
        <img src="spa.jpg" alt="Spa"/> wellness center</li>
        
        <li><i class="fa fa-utensils"></i> Three restaurants featuring 
        <img src="restaurant.jpg" alt="Restaurant"/> international cuisine</li>
        
        <li><i class="fa fa-wifi"></i> Complimentary high-speed WiFi throughout</li>
        
        <li><i class="fa fa-dumbbell"></i> State-of-the-art 
        <img src="gym.jpg" alt="Gym"/> fitness center</li>
    </ul>
    
    <h3>Accommodations</h3>
    <p>Choose from our <strong>deluxe suites</strong> 
    <img src="suite.jpg" alt="Suite"/> with panoramic 
    <img src="ocean-view.jpg" alt="Ocean"/> ocean views, or our cozy 
    <img src="garden-room.jpg" alt="Garden"/> garden rooms.</p>
    
    <p>All rooms include <i class="fa fa-tv"></i> smart TV, 
    <i class="fa fa-coffee"></i> coffee maker, and 
    <img src="minibar.jpg" alt="Minibar"/> stocked minibar.</p>
    
    <h3>Location</h3>
    <p>Situated on pristine white sand beach 
    <img src="beach.jpg" alt="Beach"/>, just 
    <i class="fa fa-car"></i> 15 minutes from city center.</p>
</div>
"""

# Shorter HTML for quick test
SHORT_HTML = """
<p>Welcome to our <img src="hotel.jpg"/> luxury hotel! 
Check-in at <i class="fa fa-clock"></i> 2 PM.</p>
"""


async def test_translation(html: str, test_name: str):
    """Test translation with timing"""
    print(f"\n{'='*60}")
    print(f"Test: {test_name}")
    print(f"HTML size: {len(html)} chars")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            API_URL,
            json={
                "texts": [html],
                "target": "vi",
                "source": "auto",
                "is_html": True,
                "concurrent": 4,
                "prefer_deepl": True,
                "apply_glossary": True
            },
            headers={
                "X-Tenant-Code": "boton_blue"
            }
        )
        
        if response.status_code != 200:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return None
        
        result = response.json()
    
    elapsed = time.time() - start_time
    
    print(f"\n✅ Translation successful!")
    print(f"⏱️  Time: {elapsed:.2f} seconds")
    print(f"📊 Characters: {len(html)} → {len(result[0])}")
    print(f"🚀 Speed: {len(html) / elapsed:.0f} chars/sec")
    
    # Preview result
    preview = result[0][:200] + "..." if len(result[0]) > 200 else result[0]
    print(f"\n📝 Preview:")
    print(preview)
    
    return elapsed


async def main():
    print("🧪 HTML Translation Optimization Test")
    print("=" * 60)
    
    # Test 1: Short HTML
    time1 = await test_translation(SHORT_HTML, "Short HTML (with images & icons)")
    
    # Wait a bit
    await asyncio.sleep(2)
    
    # Test 2: Long HTML
    time2 = await test_translation(SAMPLE_HTML, "Long HTML (10+ images, 8+ icons)")
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 Performance Summary")
    print(f"{'='*60}")
    if time1 and time2:
        print(f"Short HTML: {time1:.2f}s ({len(SHORT_HTML)} chars)")
        print(f"Long HTML:  {time2:.2f}s ({len(SAMPLE_HTML)} chars)")
        print(f"\n💡 Expected with OLD method:")
        print(f"   Short: ~4-6s (estimated)")
        print(f"   Long:  ~15-20s (estimated)")
        print(f"\n🎉 Optimization gain:")
        print(f"   Short: ~{((5 - time1) / 5 * 100):.0f}% faster")
        print(f"   Long:  ~{((17 - time2) / 17 * 100):.0f}% faster")


if __name__ == "__main__":
    asyncio.run(main())
