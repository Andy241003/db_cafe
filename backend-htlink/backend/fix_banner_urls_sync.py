"""
Script to fix banner image URLs in database
Converts old file_key based URLs to new media ID based URLs
Uses synchronous PyMySQL (already installed in container)
"""
import os
import json
import re
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Get database credentials from environment variables
MYSQL_SERVER = os.getenv("MYSQL_SERVER", "db")
MYSQL_USER = os.getenv("MYSQL_USER", "hotellink360_user")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "StrongDBPassword2024!")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "hotellink360_db")

# Construct database URL for MySQL with pymysql (synchronous)
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_SERVER}:{MYSQL_PORT}/{MYSQL_DATABASE}"

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


def fix_banner_urls():
    """
    Fix banner URLs in the database by converting file_key based URLs
    to media ID based URLs.
    """
    print(f"Connecting to database: {DATABASE_URL.replace(MYSQL_PASSWORD, '***')}")
    
    # Create sync engine
    engine = create_engine(DATABASE_URL, echo=True)
    Session = sessionmaker(bind=engine)

    with Session() as session:
        try:
            # Get all properties with banner_images
            result = session.execute(
                text("SELECT id, tenant_id, banner_images FROM properties WHERE banner_images IS NOT NULL AND banner_images != 'null'")
            )
            properties = result.fetchall()
            
            print(f"\nFound {len(properties)} properties with banner images")
            
            updated_count = 0
            
            for prop in properties:
                property_id = prop[0]
                tenant_id = prop[1]
                banner_images_str = prop[2]
                
                if not banner_images_str or banner_images_str == 'null':
                    continue
                
                try:
                    banner_images = json.loads(banner_images_str)
                except json.JSONDecodeError:
                    print(f"Warning: Could not parse banner_images for property {property_id}")
                    continue
                
                if not banner_images:
                    continue
                
                print(f"\nProcessing property {property_id}:")
                print(f"  Current banners: {banner_images}")
                
                new_banner_images = []
                changed = False
                
                for url in banner_images:
                    # Extract file_key from URL patterns like:
                    # - /api/v1/media/{file_key}.jpg
                    # - /api/v1/media/{file_key}
                    # - http://localhost:8000/api/v1/media/{file_key}.jpg
                    
                    # Match UUID pattern (8-4-4-4-12 format)
                    match = re.search(r'/api/v1/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', url, re.IGNORECASE)
                    
                    if match:
                        file_key = match.group(1)
                        
                        # Try with and without extensions (.jpg, .png, etc)
                        # First try with the file_key as-is
                        media_result = session.execute(
                            text("SELECT id FROM media_files WHERE (file_key = :file_key OR file_key = :file_key_jpg OR file_key = :file_key_png) AND tenant_id = :tenant_id"),
                            {"file_key": file_key, "file_key_jpg": f"{file_key}.jpg", "file_key_png": f"{file_key}.png", "tenant_id": tenant_id}
                        )
                        media_row = media_result.fetchone()
                        
                        if media_row:
                            media_id = media_row[0]
                            new_url = f"{BASE_URL}/api/v1/media/{media_id}/download"
                            new_banner_images.append(new_url)
                            changed = True
                            print(f"  ✓ Converted: {url} -> {new_url}")
                        else:
                            print(f"  ✗ Warning: MediaFile not found for file_key {file_key}")
                            new_banner_images.append(url)  # Keep original if not found
                    else:
                        # URL already in correct format or unknown format
                        new_banner_images.append(url)
                
                if changed:
                    # Update the property
                    new_banner_images_json = json.dumps(new_banner_images)
                    session.execute(
                        text("UPDATE properties SET banner_images = :banner_images WHERE id = :property_id"),
                        {"banner_images": new_banner_images_json, "property_id": property_id}
                    )
                    updated_count += 1
                    print(f"  ✓ Updated property {property_id}")
            
            session.commit()
            print(f"\n✅ Successfully updated {updated_count} properties")
            
        except Exception as e:
            session.rollback()
            print(f"❌ Error: {e}")
            raise
        finally:
            session.close()
        
    engine.dispose()


if __name__ == "__main__":
    fix_banner_urls()
