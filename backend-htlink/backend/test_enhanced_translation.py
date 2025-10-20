"""
Test script for enhanced translation service.
Tests DeepL, Google Cloud, and hotel glossary features.
"""
import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.enhanced_translation import (
    translate_text_enhanced,
    translate_batch_enhanced,
    _smart_chunk_text,
    HOTEL_GLOSSARY
)


async def test_basic_translation():
    """Test basic translation with different services."""
    print("\n" + "="*80)
    print("🧪 TEST 1: Basic Translation")
    print("="*80)
    
    text = "Welcome to our luxury hotel! Check-in is at 2 PM."
    
    print(f"\n📝 Original (EN): {text}")
    
    # Vietnamese
    result_vi = await translate_text_enhanced(text, "vi", apply_glossary=True)
    print(f"🇻🇳 Vietnamese: {result_vi}")
    
    # Japanese
    result_ja = await translate_text_enhanced(text, "ja", apply_glossary=True)
    print(f"🇯🇵 Japanese: {result_ja}")
    
    # Korean
    result_ko = await translate_text_enhanced(text, "ko", apply_glossary=True)
    print(f"🇰🇷 Korean: {result_ko}")


async def test_hotel_glossary():
    """Test hotel industry glossary."""
    print("\n" + "="*80)
    print("🏨 TEST 2: Hotel Glossary")
    print("="*80)
    
    text = """
    Our deluxe suite features:
    - Ocean view balcony
    - Complimentary minibar
    - 24/7 room service
    - Access to spa and fitness center
    - All-inclusive breakfast
    """
    
    print(f"\n📝 Original (EN):\n{text}")
    
    result_vi = await translate_text_enhanced(text, "vi", apply_glossary=True)
    print(f"\n🇻🇳 Vietnamese (with glossary):\n{result_vi}")
    
    result_ja = await translate_text_enhanced(text, "ja", apply_glossary=True)
    print(f"\n🇯🇵 Japanese (with glossary):\n{result_ja}")


async def test_html_translation():
    """Test HTML translation with image preservation."""
    print("\n" + "="*80)
    print("📄 TEST 3: HTML Translation")
    print("="*80)
    
    html = """
    <h1>Welcome to Tabi Hotel</h1>
    <img src="https://example.com/hotel.jpg" alt="Luxury Hotel" />
    <p>Experience <strong>luxury</strong> and <em>comfort</em> in the heart of the city.</p>
    <ul>
        <li>Premium amenities</li>
        <li>Ocean view rooms</li>
        <li>Complimentary breakfast</li>
    </ul>
    """
    
    print(f"\n📝 Original HTML:\n{html}")
    
    result = await translate_text_enhanced(html, "vi", is_html=True, apply_glossary=True)
    print(f"\n🇻🇳 Translated HTML (Vietnamese):\n{result}")


async def test_long_text_chunking():
    """Test smart chunking for long texts."""
    print("\n" + "="*80)
    print("📚 TEST 4: Long Text Chunking")
    print("="*80)
    
    # Generate a long text (simulate a blog post)
    long_text = """
    Welcome to Hotel Name, a premier luxury destination in Ho Chi Minh City.
    
    Our hotel offers an unparalleled experience with world-class amenities and services.
    From the moment you check-in, our dedicated concierge team ensures every aspect
    of your stay exceeds expectations.
    
    Accommodation:
    We feature 200 rooms across multiple categories:
    - Standard Rooms: Perfect for business travelers
    - Superior Rooms: Enhanced comfort with city views
    - Deluxe Suites: Spacious luxury with premium amenities
    - Ocean View Suites: Breathtaking panoramic views
    
    Dining:
    Experience culinary excellence at our five restaurants:
    - SkyBar: Rooftop cocktails and sunset views
    - Azure Restaurant: Fine dining with international cuisine
    - Café Lotus: All-day dining with complimentary breakfast
    - Sushi Garden: Authentic Japanese cuisine
    - Pool Bar: Refreshments by the infinity pool
    
    Facilities:
    - Infinity pool with ocean view
    - State-of-the-art fitness center
    - Full-service spa and wellness center
    - Business center with meeting rooms
    - Grand ballroom for events and conferences
    
    Services:
    - 24/7 room service
    - Concierge and tour assistance
    - Airport shuttle (complimentary)
    - Laundry and dry cleaning
    - Babysitting services
    
    Book now and enjoy our all-inclusive packages with special rates!
    """ * 3  # Make it even longer
    
    print(f"\n📝 Original length: {len(long_text)} characters")
    
    # Test chunking
    chunks = _smart_chunk_text(long_text, max_chunk_size=1000)
    print(f"📦 Split into {len(chunks)} chunks")
    for i, chunk in enumerate(chunks[:3]):  # Show first 3 chunks
        print(f"   Chunk {i+1}: {len(chunk)} chars - {chunk[:50]}...")
    
    # Translate
    print("\n⏳ Translating to Vietnamese...")
    result = await translate_text_enhanced(long_text, "vi", apply_glossary=True)
    print(f"✅ Translation complete: {len(result)} characters")
    print(f"\n🇻🇳 First 500 chars:\n{result[:500]}...")


async def test_batch_translation():
    """Test batch translation with parallel processing."""
    print("\n" + "="*80)
    print("⚡ TEST 5: Batch Translation (Parallel)")
    print("="*80)
    
    texts = [
        "Check-in time is 2:00 PM, check-out is 12:00 PM.",
        "Our deluxe suite includes ocean view and private balcony.",
        "Complimentary breakfast served daily from 6:30 AM to 10:30 AM.",
        "Room service available 24 hours a day.",
        "Enjoy our spa, fitness center, and infinity pool amenities.",
        "All-inclusive packages available with special rates.",
        "Business center and meeting rooms for corporate events.",
        "Concierge services for tour bookings and reservations."
    ]
    
    print(f"\n📝 Translating {len(texts)} texts to Vietnamese (parallel)...")
    
    import time
    start_time = time.time()
    
    results = await translate_batch_enhanced(
        texts, 
        "vi", 
        apply_glossary=True,
        concurrent=4
    )
    
    elapsed = time.time() - start_time
    
    print(f"✅ Completed in {elapsed:.2f} seconds")
    print(f"⚡ Speed: {len(texts)/elapsed:.1f} texts/second")
    
    for i, (original, translated) in enumerate(zip(texts, results), 1):
        print(f"\n{i}. EN: {original}")
        print(f"   VI: {translated}")


async def test_fallback_chain():
    """Test fallback chain: DeepL → Google Cloud → Google Free."""
    print("\n" + "="*80)
    print("🔄 TEST 6: Fallback Chain")
    print("="*80)
    
    text = "Welcome to our luxury hotel!"
    
    print(f"\n📝 Original: {text}")
    
    # Check which APIs are available
    deepl_key = os.getenv("DEEPL_API_KEY")
    google_key = os.getenv("GOOGLE_CLOUD_API_KEY")
    
    print(f"\n🔑 API Keys configured:")
    print(f"   DeepL: {'✅ Available' if deepl_key else '❌ Not set'}")
    print(f"   Google Cloud: {'✅ Available' if google_key else '❌ Not set'}")
    print(f"   Google Free: ✅ Always available")
    
    print(f"\n⏳ Translating (will use best available service)...")
    result = await translate_text_enhanced(text, "vi", prefer_deepl=True)
    print(f"✅ Result: {result}")


async def test_glossary_terms():
    """Display all hotel glossary terms."""
    print("\n" + "="*80)
    print("📖 TEST 7: Hotel Glossary Terms")
    print("="*80)
    
    print("\n🏨 Available hotel industry terms:")
    print(f"\n{'English':<25} {'Vietnamese':<25} {'Japanese':<25} {'Korean':<20}")
    print("-" * 95)
    
    for term, translations in HOTEL_GLOSSARY["en"].items():
        vi = translations.get("vi", "-")
        ja = translations.get("ja", "-")
        ko = translations.get("ko", "-")
        print(f"{term:<25} {vi:<25} {ja:<25} {ko:<20}")


async def main():
    """Run all tests."""
    print("\n" + "="*80)
    print("🚀 ENHANCED TRANSLATION SERVICE - TEST SUITE")
    print("="*80)
    
    try:
        await test_basic_translation()
        await test_hotel_glossary()
        await test_html_translation()
        await test_long_text_chunking()
        await test_batch_translation()
        await test_fallback_chain()
        await test_glossary_terms()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("="*80)
        print("\n💡 Tips:")
        print("   - Set DEEPL_API_KEY for best quality (free 500K chars/month)")
        print("   - Set GOOGLE_CLOUD_API_KEY for backup ($300 free credit)")
        print("   - Without API keys, falls back to free Google Translate")
        print("\n🔗 Get API keys:")
        print("   DeepL: https://www.deepl.com/pro-api")
        print("   Google Cloud: https://console.cloud.google.com/")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
