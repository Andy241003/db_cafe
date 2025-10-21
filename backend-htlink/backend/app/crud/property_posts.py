from typing import List, Optional
import re
from sqlmodel import Session, select
from sqlalchemy import text
from app.models.property_posts import (
    PropertyPost, 
    PropertyPostTranslation,
    PropertyPostCreate,
    PropertyPostUpdate,
    PropertyPostTranslationCreate,
    PropertyPostTranslationUpdate
)


def _extract_title_and_content(html_content: str) -> tuple[str, str]:
    """Extract title from <h2> tag at the beginning of content"""
    if not html_content:
        return '', ''
    
    # Match <h2>Title</h2> at the start (with optional whitespace)
    match = re.match(r'^\s*<h2>(.*?)</h2>\s*', html_content, re.IGNORECASE | re.DOTALL)
    if match:
        title = match.group(1).strip()
        # Remove the h2 tag from content
        content = html_content[match.end():].strip()
        return title, content
    
    return '', html_content


def create_property_post(session: Session, post_data: PropertyPostCreate) -> PropertyPost:
    """Create a new property post with translations"""
    # Create main post
    db_post = PropertyPost(
        property_id=post_data.property_id,
        status=post_data.status
    )
    session.add(db_post)
    session.commit()
    session.refresh(db_post)
    
    # Create translations
    for translation_data in post_data.translations:
        # Merge title into content if title is provided
        content = translation_data.content or ''
        if translation_data.title:
            # Remove existing <h2> tag if present
            content = re.sub(r'^\s*<h2>.*?</h2>\s*', '', content, count=1, flags=re.IGNORECASE | re.DOTALL)
            # Prepend new title as h2 tag
            content = f'<h2>{translation_data.title}</h2>\n{content}'
        
        db_translation = PropertyPostTranslation(
            post_id=db_post.id,
            locale=translation_data.locale,
            content=content
        )
        session.add(db_translation)
    
    session.commit()
    session.refresh(db_post)
    return db_post


def get_property_posts(
    session: Session, 
    property_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[PropertyPost]:
    """Get property posts with optional filters"""
    query = select(PropertyPost)
    
    if property_id:
        query = query.where(PropertyPost.property_id == property_id)
    if status:
        query = query.where(PropertyPost.status == status)
        
    query = query.offset(skip).limit(limit)
    
    posts = session.exec(query).all()
    
    # Load translations for each post
    for post in posts:
        translations_query = select(PropertyPostTranslation).where(
            PropertyPostTranslation.post_id == post.id
        )
        post.translations = session.exec(translations_query).all()
    
    return posts


def get_property_post(session: Session, post_id: int) -> Optional[PropertyPost]:
    """Get a single property post by ID with translations"""
    post = session.get(PropertyPost, post_id)
    if post:
        # Load translations
        translations_query = select(PropertyPostTranslation).where(
            PropertyPostTranslation.post_id == post.id
        )
        post.translations = session.exec(translations_query).all()
    return post


def update_property_post(
    session: Session, 
    post_id: int, 
    post_data: PropertyPostUpdate
) -> Optional[PropertyPost]:
    """Update a property post and its translations"""
    post = session.get(PropertyPost, post_id)
    if not post:
        return None
    
    # Update main post fields
    if post_data.property_id is not None:
        post.property_id = post_data.property_id
    if post_data.status is not None:
        post.status = post_data.status
    
    session.add(post)
    
    # Update translations if provided
    if post_data.translations is not None:
        # Delete existing translations
        existing_translations = session.exec(
            select(PropertyPostTranslation).where(PropertyPostTranslation.post_id == post_id)
        ).all()
        for translation in existing_translations:
            session.delete(translation)
        
        # Add new translations
        for translation_data in post_data.translations:
            # Merge title into content if title is provided
            content = translation_data.content or ''
            if translation_data.title:
                # Remove existing <h2> tag if present
                content = re.sub(r'^\s*<h2>.*?</h2>\s*', '', content, count=1, flags=re.IGNORECASE | re.DOTALL)
                # Prepend new title as h2 tag
                content = f'<h2>{translation_data.title}</h2>\n{content}'
            
            db_translation = PropertyPostTranslation(
                post_id=post_id,
                locale=translation_data.locale,
                content=content
            )
            session.add(db_translation)
    
    session.commit()
    session.refresh(post)
    
    # Load updated translations
    translations_query = select(PropertyPostTranslation).where(
        PropertyPostTranslation.post_id == post.id
    )
    post.translations = session.exec(translations_query).all()
    
    return post


def delete_property_post(session: Session, post_id: int) -> bool:
    """Delete a property post (translations will be deleted automatically due to CASCADE)"""
    post = session.get(PropertyPost, post_id)
    if not post:
        return False
    # Explicitly delete translations first because property_post_translations
    # uses a composite primary key that includes post_id; trying to delete
    # the parent row without clearing children can cause SQLAlchemy to attempt
    # to null-out the child's post_id which is part of its PK and triggers
    # an AssertionError. Remove translations first, then delete the post.
    translations = session.exec(
        select(PropertyPostTranslation).where(PropertyPostTranslation.post_id == post_id)
    ).all()
    for t in translations:
        session.delete(t)

    session.delete(post)
    session.commit()
    return True


def get_property_posts_by_locale(
    session: Session,
    property_id: int,
    locale: str = "en",
    status: str = "published",
    skip: int = 0,
    limit: int = 100
) -> List[dict]:
    """Get property posts with translations for a specific locale"""
    # Use raw SQL to avoid ORM model/DB column mismatches in environments where
    # the translations table may have a different shape (older schema).
    sql = text(
        "SELECT p.id AS id, p.property_id AS property_id, p.status AS status, p.created_at AS created_at, p.updated_at AS updated_at, "
        "t.content AS content, t.locale AS locale "
        "FROM property_posts p "
        "INNER JOIN property_post_translations t ON p.id = t.post_id "
        "WHERE p.property_id = :property_id AND p.status = :status AND t.locale = :locale "
        "LIMIT :limit OFFSET :skip"
    )

    params = {
        "property_id": property_id,
        "status": status,
        "locale": locale,
        "limit": limit,
        "skip": skip,
    }

    # Execute raw SQL via the session connection
    conn = session.get_bind()
    result = conn.execute(sql, params)
    posts = []
    for row in result.fetchall():
        posts.append({
            "id": row.id,
            "property_id": row.property_id,
            "status": row.status,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
            "content": row.content,
            "locale": row.locale,
        })

    return posts