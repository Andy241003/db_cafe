from typing import List, Optional
from sqlmodel import Session, select
from app.models.property_posts import (
    PropertyPost, 
    PropertyPostTranslation,
    PropertyPostCreate,
    PropertyPostUpdate,
    PropertyPostTranslationCreate,
    PropertyPostTranslationUpdate
)


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
        db_translation = PropertyPostTranslation(
            post_id=db_post.id,
            **translation_data.model_dump()
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
            db_translation = PropertyPostTranslation(
                post_id=post_id,
                **translation_data.model_dump()
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
    query = select(PropertyPost, PropertyPostTranslation).join(
        PropertyPostTranslation, PropertyPost.id == PropertyPostTranslation.post_id
    ).where(
        PropertyPost.property_id == property_id,
        PropertyPost.status == status,
        PropertyPostTranslation.locale == locale
    ).offset(skip).limit(limit)
    
    results = session.exec(query).all()
    
    posts = []
    for post, translation in results:
        posts.append({
            "id": post.id,
            "property_id": post.property_id,
            "status": post.status,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "content": translation.content,
            "locale": translation.locale
        })
    
    return posts