#!/usr/bin/env python3
"""
Fix banner image URLs in database:
1. Convert /download -> /view for public access
2. Convert old file_key format to new media ID format
"""

import re
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = "mysql+pymysql://root:VeryStrongRootPass2024!@localhost:3307/hotellink360_db"

def fix_banner_urls():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Get all properties with banner_images
        result = session.execute(text("""
            SELECT id, property_name, banner_images 
            FROM properties 
            WHERE banner_images IS NOT NULL 
            AND banner_images != '[]'
        """))
        
        properties = result.fetchall()
        print(f"Found {len(properties)} properties with banner images")
        
        for prop in properties:
            prop_id, prop_name, banner_json = prop
            print(f"\n🏨 Property: {prop_name} (ID: {prop_id})")
            
            try:
                banners = json.loads(banner_json)
                updated_banners = []
                changed = False
                
                for url in banners:
                    print(f"  Original: {url}")
                    new_url = url
                    
                    # Fix 1: Convert /download to /view
                    if '/download' in url:
                        new_url = url.replace('/download', '/view')
                        changed = True
                        print(f"  ✅ Changed /download -> /view")
                    
                    # Fix 2: Convert old file_key format to media ID format
                    # Pattern: /api/v1/media/UUID.jpg -> Need to find media ID
                    file_key_match = re.search(r'/media/([a-f0-9-]+\.(jpg|jpeg|png|gif|webp))', url, re.IGNORECASE)
                    if file_key_match:
                        file_key = file_key_match.group(1)
                        print(f"  🔍 Found old format with file_key: {file_key}")
                        
                        # Look up media ID from file_key
                        media_result = session.execute(text("""
                            SELECT id FROM media_files 
                            WHERE file_key = :file_key
                        """), {"file_key": file_key})
                        
                        media_row = media_result.fetchone()
                        if media_row:
                            media_id = media_row[0]
                            # Replace with new format
                            base_url = url.split('/media/')[0]
                            new_url = f"{base_url}/media/{media_id}/view"
                            changed = True
                            print(f"  ✅ Converted to media ID {media_id}: {new_url}")
                        else:
                            print(f"  ⚠️  Media file not found for file_key: {file_key}")
                    
                    updated_banners.append(new_url)
                
                if changed:
                    # Update database
                    session.execute(text("""
                        UPDATE properties 
                        SET banner_images = :banners 
                        WHERE id = :prop_id
                    """), {
                        "banners": json.dumps(updated_banners),
                        "prop_id": prop_id
                    })
                    session.commit()
                    print(f"  ✅ Updated property {prop_id}")
                else:
                    print(f"  ℹ️  No changes needed")
                    
            except json.JSONDecodeError:
                print(f"  ❌ Invalid JSON in banner_images")
                continue
        
        print("\n✅ All banner URLs fixed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    fix_banner_urls()
