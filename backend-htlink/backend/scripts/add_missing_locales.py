"""
Script to add missing locales to the database
Run this script to fix locale-related errors
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models import Locale

def add_locales():
    """Add all required locales to the database"""
    locales_data = [
        {'code': 'en', 'name': 'English', 'native_name': 'English'},
        {'code': 'vi', 'name': 'Vietnamese', 'native_name': 'Tiếng Việt'},
        {'code': 'ja', 'name': 'Japanese', 'native_name': '日本語'},
        {'code': 'kr', 'name': 'Korean', 'native_name': '한국어'},
        {'code': 'fr', 'name': 'French', 'native_name': 'Français'},
        {'code': 'zh', 'name': 'Chinese', 'native_name': '中文'},
        {'code': 'es', 'name': 'Spanish', 'native_name': 'Español'},
        {'code': 'de', 'name': 'German', 'native_name': 'Deutsch'},
    ]
    
    print("🔥 Adding missing locales to database...")
    print("=" * 50)
    
    with Session(engine) as session:
        for locale_data in locales_data:
            # Check if locale already exists
            existing = session.exec(
                select(Locale).where(Locale.code == locale_data['code'])
            ).first()
            
            if existing:
                print(f"⚠️  Locale '{locale_data['code']}' already exists - skipping")
            else:
                locale = Locale(**locale_data)
                session.add(locale)
                print(f"✅ Added locale: {locale_data['code']} ({locale_data['name']})")
        
        session.commit()
        print("=" * 50)
        print("✅ All locales added successfully!")
        print("\nYou can now use these locales in translations:")
        for locale_data in locales_data:
            print(f"  - {locale_data['code']}: {locale_data['name']} ({locale_data['native_name']})")

if __name__ == "__main__":
    try:
        add_locales()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

