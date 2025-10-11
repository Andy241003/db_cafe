#!/usr/bin/env python3
"""
Add Tourism Locales Script

Thêm 25+ ngôn ngữ phổ biến của các quốc gia/vùng lãnh thổ có lượng khách du lịch lớn đến Việt Nam

Cách dùng:
    python add_tourism_locales.py

Hoặc chạy trong Docker:
    docker-compose exec backend python /app/scripts/add_tourism_locales.py
"""

import sys
sys.path.insert(0, '/app')

from sqlmodel import Session, select
from app.core.db import engine
from app.models import Locale


def add_tourism_locales():
    """Add all tourism-related locales to the database"""
    
    # 25+ ngôn ngữ phổ biến theo khu vực
    locales_data = [
        # 🌏 Châu Á - Nguồn khách lớn nhất
        {'code': 'zh-CN', 'name': 'Chinese (Simplified)', 'native_name': '中文（简体）'},
        {'code': 'zh-TW', 'name': 'Chinese (Traditional)', 'native_name': '中文（繁體）'},
        {'code': 'ko', 'name': 'Korean', 'native_name': '한국어'},
        {'code': 'ja', 'name': 'Japanese', 'native_name': '日本語'},
        {'code': 'th', 'name': 'Thai', 'native_name': 'ภาษาไทย'},
        {'code': 'ms', 'name': 'Malay', 'native_name': 'Bahasa Melayu'},
        {'code': 'id', 'name': 'Indonesian', 'native_name': 'Bahasa Indonesia'},
        {'code': 'tl', 'name': 'Filipino (Tagalog)', 'native_name': 'Tagalog'},
        {'code': 'yue', 'name': 'Cantonese', 'native_name': '粵語'},
        
        # 🌍 Châu Âu
        {'code': 'en', 'name': 'English', 'native_name': 'English'},
        {'code': 'fr', 'name': 'French', 'native_name': 'Français'},
        {'code': 'de', 'name': 'German', 'native_name': 'Deutsch'},
        {'code': 'ru', 'name': 'Russian', 'native_name': 'Русский'},
        {'code': 'es', 'name': 'Spanish', 'native_name': 'Español'},
        {'code': 'it', 'name': 'Italian', 'native_name': 'Italiano'},
        
        # 🌎 Châu Mỹ & Châu Đại Dương
        {'code': 'en-US', 'name': 'English (US)', 'native_name': 'English (US)'},
        {'code': 'en-AU', 'name': 'English (Australia)', 'native_name': 'English (AU)'},
        {'code': 'en-CA', 'name': 'English (Canada)', 'native_name': 'English (CA)'},
        {'code': 'fr-CA', 'name': 'French (Canada)', 'native_name': 'Français (CA)'},
        {'code': 'pt-BR', 'name': 'Portuguese (Brazil)', 'native_name': 'Português (BR)'},
        
        # 🌍 Trung Đông & Nam Á
        {'code': 'hi', 'name': 'Hindi', 'native_name': 'हिन्दी'},
        {'code': 'ar', 'name': 'Arabic', 'native_name': 'العربية'},
        {'code': 'ta', 'name': 'Tamil', 'native_name': 'தமிழ்'},
        
        # 🇻🇳 Việt Nam
        {'code': 'vi', 'name': 'Vietnamese', 'native_name': 'Tiếng Việt'},
    ]
    
    print("=" * 80)
    print("🌍 ADDING TOURISM LOCALES TO DATABASE")
    print("=" * 80)
    print(f"\n📊 Total locales to add: {len(locales_data)}\n")
    
    added_count = 0
    updated_count = 0
    skipped_count = 0
    
    with Session(engine) as session:
        for locale_data in locales_data:
            # Check if locale already exists
            existing = session.exec(
                select(Locale).where(Locale.code == locale_data['code'])
            ).first()
            
            if existing:
                # Update existing locale
                if existing.name != locale_data['name'] or existing.native_name != locale_data['native_name']:
                    existing.name = locale_data['name']
                    existing.native_name = locale_data['native_name']
                    session.add(existing)
                    print(f"🔄 Updated: {locale_data['code']:8} - {locale_data['name']:30} ({locale_data['native_name']})")
                    updated_count += 1
                else:
                    print(f"⏭️  Skipped: {locale_data['code']:8} - {locale_data['name']:30} (already exists)")
                    skipped_count += 1
            else:
                # Add new locale
                locale = Locale(**locale_data)
                session.add(locale)
                print(f"✅ Added:   {locale_data['code']:8} - {locale_data['name']:30} ({locale_data['native_name']})")
                added_count += 1
        
        session.commit()
    
    print("\n" + "=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)
    print(f"✅ Added:   {added_count} locales")
    print(f"🔄 Updated: {updated_count} locales")
    print(f"⏭️  Skipped: {skipped_count} locales")
    print(f"📦 Total:   {len(locales_data)} locales")
    print("=" * 80)
    
    # Display locales by region
    print("\n🌏 LOCALES BY REGION")
    print("=" * 80)
    
    regions = {
        '🌏 Châu Á': ['zh-CN', 'zh-TW', 'ko', 'ja', 'th', 'ms', 'id', 'tl', 'yue'],
        '🌍 Châu Âu': ['en', 'fr', 'de', 'ru', 'es', 'it'],
        '🌎 Châu Mỹ & Châu Đại Dương': ['en-US', 'en-AU', 'en-CA', 'fr-CA', 'pt-BR'],
        '🌍 Trung Đông & Nam Á': ['hi', 'ar', 'ta'],
        '🇻🇳 Việt Nam': ['vi'],
    }
    
    with Session(engine) as session:
        for region_name, codes in regions.items():
            print(f"\n{region_name}:")
            for code in codes:
                locale = session.exec(select(Locale).where(Locale.code == code)).first()
                if locale:
                    print(f"  • {locale.code:8} - {locale.name:30} ({locale.native_name})")
    
    print("\n" + "=" * 80)
    print("✅ ALL TOURISM LOCALES ADDED SUCCESSFULLY!")
    print("=" * 80)
    print("\n💡 Next steps:")
    print("  1. Restart backend if needed: docker-compose restart backend")
    print("  2. Check locales in admin panel: /locales")
    print("  3. Use these locales in property translations")
    print("\n")


if __name__ == "__main__":
    try:
        add_tourism_locales()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

