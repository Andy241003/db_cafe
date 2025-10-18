"""
Script to fix banner image URLs in database
Converts old file_key based URLs to new media ID based URLs
"""
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import Property, MediaFile
import os

# Database URL from environment - using MySQL
MYSQL_SERVER = os.getenv("MYSQL_SERVER", "db")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "hotellink360_user")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "StrongDBPassword2024!")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "hotellink360_db")

DATABASE_URL = f"mysql+aiomysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_SERVER}:{MYSQL_PORT}/{MYSQL_DATABASE}"

async def fix_banner_urls():
    """Fix all banner URLs in properties table"""
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Get all properties with banner_images
            result = await session.execute(
                select(Property).where(Property.banner_images.isnot(None))
            )
            properties = result.scalars().all()
            
            print(f"\n📊 Found {len(properties)} properties with banner images")
            
            fixed_count = 0
            for property in properties:
                if not property.banner_images:
                    continue
                
                print(f"\n🏨 Processing property: {property.property_name} (ID: {property.id})")
                print(f"   Old URLs count: {len(property.banner_images)}")
                
                new_urls = []
                for old_url in property.banner_images:
                    print(f"   📎 Old URL: {old_url}")
                    
                    # Extract file_key from old URL
                    file_key = None
                    if '/media/' in old_url:
                        # Extract file_key from URL like "/api/v1/media/file.jpg"
                        file_key = old_url.split('/media/')[-1].split('?')[0]
                        # Remove any leading slash
                        file_key = file_key.lstrip('/')
                    else:
                        # URL is already just the file_key
                        file_key = old_url
                    
                    if not file_key:
                        print(f"   ⚠️  Could not extract file_key from: {old_url}")
                        continue
                    
                    print(f"   🔍 Looking for file_key: {file_key}")
                    
                    # Find media file by file_key
                    media_result = await session.execute(
                        select(MediaFile).where(MediaFile.file_key == file_key)
                    )
                    media_file = media_result.scalar_one_or_none()
                    
                    if media_file:
                        # Create new URL with media ID
                        new_url = f"http://localhost:8000/api/v1/media/{media_file.id}/download"
                        new_urls.append(new_url)
                        print(f"   ✅ New URL: {new_url}")
                        fixed_count += 1
                    else:
                        print(f"   ❌ Media file not found for file_key: {file_key}")
                        # Keep old URL if media file not found
                        new_urls.append(old_url)
                
                if new_urls:
                    property.banner_images = new_urls
                    print(f"   💾 Updated property with {len(new_urls)} banner URLs")
            
            # Commit all changes
            await session.commit()
            print(f"\n✅ Successfully fixed {fixed_count} banner URLs!")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            await session.rollback()
            raise
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_banner_urls())
