from typing import Optional, List, Dict, Any, Union
from sqlmodel import Session, select
from sqlalchemy import text
from fastapi import HTTPException
from .base import CRUDBase
from ..models import (
    Property, PropertyTranslation, FeatureCategory, FeatureCategoryTranslation,
    Feature, FeatureTranslation, PropertyCategory, PropertyFeature,
    Post, PostTranslation, MediaFile, PostMedia, Event, Setting
)
from ..schemas import (
    PropertyCreate, PropertyUpdate,
    PropertyTranslationCreate, PropertyTranslationUpdate,
    FeatureCategoryCreate, FeatureCategoryUpdate,
    FeatureCategoryTranslationCreate, FeatureCategoryTranslationUpdate,
    FeatureCreate, FeatureUpdate,
    FeatureTranslationCreate, FeatureTranslationUpdate,
    PropertyCategoryCreate, PropertyCategoryUpdate,
    PropertyFeatureCreate, PropertyFeatureUpdate,
    PostCreate, PostUpdate,
    PostTranslationCreate, PostTranslationUpdate,
    MediaFileCreate, MediaFileUpdate,
    PostMediaCreate, PostMediaUpdate,
    EventCreate, SettingCreate, SettingUpdate
)


class CRUDProperty(CRUDBase[Property, PropertyCreate, PropertyUpdate]):
    def get_by_code(self, db: Session, *, code: str, tenant_id: int) -> Optional[Property]:
        """Get property by code in a tenant"""
        return db.exec(
            select(Property)
            .where(Property.code == code)
            .where(Property.tenant_id == tenant_id)
        ).first()

    def get_by_tenant(self, db: Session, *, tenant_id: int, skip: int = 0, limit: int = 100) -> List[Property]:
        """Get properties by tenant"""
        return db.exec(
            select(Property)
            .where(Property.tenant_id == tenant_id)
            .offset(skip)
            .limit(limit)
        ).all()

    def get_active(self, db: Session, *, tenant_id: int) -> List[Property]:
        """Get active properties in a tenant"""
        return db.exec(
            select(Property)
            .where(Property.tenant_id == tenant_id)
            .where(Property.is_active == True)
        ).all()


class CRUDFeatureCategory(CRUDBase[FeatureCategory, FeatureCategoryCreate, FeatureCategoryUpdate]):
    def get_by_slug(self, db: Session, *, slug: str, tenant_id: int = 0) -> Optional[FeatureCategory]:
        """Get category by slug"""
        return db.exec(
            select(FeatureCategory)
            .where(FeatureCategory.slug == slug)
            .where(FeatureCategory.tenant_id == tenant_id)
        ).first()

    def get_by_tenant(self, db: Session, *, tenant_id: int = 0, skip: int = 0, limit: int = 100, include_system: bool = True) -> List[FeatureCategory]:
        """Get categories by tenant, optionally including system categories"""
        query = select(FeatureCategory)
        
        if include_system:
            # Include both tenant-specific and system categories (tenant_id=0)
            query = query.where((FeatureCategory.tenant_id == tenant_id) | (FeatureCategory.tenant_id == 0))
        else:
            query = query.where(FeatureCategory.tenant_id == tenant_id)
            
        return db.exec(query.offset(skip).limit(limit)).all()

    def get_system_categories(self, db: Session) -> List[FeatureCategory]:
        """Get system-wide categories"""
        return db.exec(
            select(FeatureCategory)
            .where(FeatureCategory.tenant_id == 0)
            .where(FeatureCategory.is_system == True)
        ).all()

    def get_with_translations(self, db: Session, *, category_id: int, locale: str = 'en') -> Optional[Dict[str, Any]]:
        """Get category with its translations"""
        category = self.get(db, category_id)
        if not category:
            return None
            
        translation = db.exec(
            select(FeatureCategoryTranslation)
            .where(FeatureCategoryTranslation.category_id == category_id)
            .where(FeatureCategoryTranslation.locale == locale)
        ).first()
        
        result = category.dict()
        if translation:
            result['title'] = translation.title
            result['short_desc'] = translation.short_desc
        
        return result


class CRUDFeatureCategoryTranslation(CRUDBase[FeatureCategoryTranslation, FeatureCategoryTranslationCreate, FeatureCategoryTranslationUpdate]):
    def get_by_category_locale(self, db: Session, *, category_id: int, locale: str) -> Optional[FeatureCategoryTranslation]:
        """Get translation by category and locale"""
        return db.exec(
            select(FeatureCategoryTranslation)
            .where(FeatureCategoryTranslation.category_id == category_id)
            .where(FeatureCategoryTranslation.locale == locale)
        ).first()


class CRUDFeature(CRUDBase[Feature, FeatureCreate, FeatureUpdate]):
    def get_by_slug(self, db: Session, *, slug: str, tenant_id: int = 0) -> Optional[Feature]:
        """Get feature by slug"""
        return db.exec(
            select(Feature)
            .where(Feature.slug == slug)
            .where(Feature.tenant_id == tenant_id)
        ).first()

    def get_by_category(self, db: Session, *, category_id: int, tenant_id: int = 0) -> List[Feature]:
        """Get features by category"""
        return db.exec(
            select(Feature)
            .where(Feature.category_id == category_id)
            .where(Feature.tenant_id == tenant_id)
        ).all()

    def get_system_features(self, db: Session) -> List[Feature]:
        """Get system-wide features"""
        return db.exec(
            select(Feature)
            .where(Feature.tenant_id == 0)
            .where(Feature.is_system == True)
        ).all()

    def get_by_tenant(self, db: Session, *, tenant_id: int = 0, category_id: Optional[int] = None, skip: int = 0, limit: int = 100, include_system: bool = True) -> List[Feature]:
        """Get features by tenant, optionally filtered by category and including system features"""
        query = select(Feature)
        if include_system:
            query = query.where((Feature.tenant_id == tenant_id) | (Feature.tenant_id == 0))
        else:
            query = query.where(Feature.tenant_id == tenant_id)
        if category_id:
            query = query.where(Feature.category_id == category_id)
        return db.exec(query.offset(skip).limit(limit)).all()


class CRUDFeatureTranslation(CRUDBase[FeatureTranslation, FeatureTranslationCreate, FeatureTranslationUpdate]):
    def get_by_feature_locale(self, db: Session, *, feature_id: int, locale: str) -> Optional[FeatureTranslation]:
        """Get translation by feature and locale"""
        return db.exec(
            select(FeatureTranslation)
            .where(FeatureTranslation.feature_id == feature_id)
            .where(FeatureTranslation.locale == locale)
        ).first()


class CRUDPropertyCategory(CRUDBase[PropertyCategory, PropertyCategoryCreate, PropertyCategoryUpdate]):
    def get_by_property(self, db: Session, *, property_id: int) -> List[PropertyCategory]:
        """Get categories enabled for a property"""
        return db.exec(
            select(PropertyCategory)
            .where(PropertyCategory.property_id == property_id)
            .where(PropertyCategory.is_enabled == True)
            .order_by(PropertyCategory.sort_order)
        ).all()


class CRUDPropertyFeature(CRUDBase[PropertyFeature, PropertyFeatureCreate, PropertyFeatureUpdate]):
    def get_by_property(self, db: Session, *, property_id: int) -> List[PropertyFeature]:
        """Get features enabled for a property"""
        return db.exec(
            select(PropertyFeature)
            .where(PropertyFeature.property_id == property_id)
            .where(PropertyFeature.is_enabled == True)
            .order_by(PropertyFeature.sort_order)
        ).all()


class CRUDPost(CRUDBase[Post, PostCreate, PostUpdate]):
    def __init__(self, model):
        super().__init__(model)
        print("=== CRUDPost INITIALIZED ===")  # Debug log

    def create(self, db: Session, *, obj_in: PostCreate) -> Post:
        """Create post with translation"""
        print(f"🔍 DEBUG: Creating post with data: {obj_in.dict()}", flush=True)

        # Extract translation fields
        translation_data = {
            'locale': obj_in.locale,
            'title': obj_in.title,
            'content_html': obj_in.content_html
        }

        print(f"🔍 DEBUG: Translation data: {translation_data}", flush=True)

        # Create post data without translation fields
        post_data = obj_in.dict(exclude={'locale', 'title', 'content_html'})

        print(f"🔍 DEBUG: Post data: {post_data}", flush=True)

        try:
            # Create post
            db_post = Post(**post_data)
            db.add(db_post)
            db.flush()  # Get post.id without committing

            print(f"✅ DEBUG: Post created with ID: {db_post.id}", flush=True)

            # Create translation
            translation_data['post_id'] = db_post.id
            print(f"🔍 DEBUG: Creating translation with data: {translation_data}", flush=True)

            db_translation = PostTranslation(**translation_data)
            db.add(db_translation)

            db.commit()
            db.refresh(db_post)

            print(f"✅ DEBUG: Post and translation created successfully!", flush=True)
            return db_post

        except Exception as e:
            print(f"❌ DEBUG: Error creating post: {str(e)}", flush=True)
            import traceback
            print(f"❌ DEBUG: Traceback: {traceback.format_exc()}", flush=True)
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Error creating post: {str(e)}")

    def update(
        self,
        db: Session,
        *,
        db_obj: Post,
        obj_in: Union[PostUpdate, Dict[str, Any]]
    ) -> Post:
        """Update post with translation - CUSTOM METHOD"""
        print(f"=== CUSTOM POST UPDATE METHOD CALLED ===", flush=True)
        print(f"Post ID: {db_obj.id}", flush=True)
        print(f"Update data: {obj_in if isinstance(obj_in, dict) else obj_in.dict(exclude_unset=True)}", flush=True)
        
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        # Extract translation fields if provided
        translation_fields = {}
        if 'title' in update_data:
            translation_fields['title'] = update_data.pop('title')
            print(f"Found title to update: {translation_fields['title']}")
        if 'content_html' in update_data:
            translation_fields['content_html'] = update_data.pop('content_html')
            print(f"Found content_html to update: {translation_fields['content_html']}")
        if 'locale' in update_data:
            translation_fields['locale'] = update_data.pop('locale')
            print(f"Found locale: {translation_fields['locale']}")
        
        try:
            # Update post fields
            for field, value in update_data.items():
                setattr(db_obj, field, value)
            
            # Update or create translation if translation fields provided
            if translation_fields:
                locale = translation_fields.get('locale', 'en')
                
                # Try to find existing translation
                existing_translation = db.exec(
                    select(PostTranslation)
                    .where(PostTranslation.post_id == db_obj.id)
                    .where(PostTranslation.locale == locale)
                ).first()
                
                if existing_translation:
                    # Update existing translation
                    for field, value in translation_fields.items():
                        if field != 'locale':  # Don't update locale itself
                            setattr(existing_translation, field, value)
                else:
                    # Create new translation
                    translation_fields['post_id'] = db_obj.id
                    if 'locale' not in translation_fields:
                        translation_fields['locale'] = 'en'
                    db_translation = PostTranslation(**translation_fields)
                    db.add(db_translation)
            
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Error updating post: {str(e)}")

    def get_by_slug(self, db: Session, *, slug: str, tenant_id: int, property_id: int, feature_id: int) -> Optional[Post]:
        """Get post by slug (unique within tenant/property/feature)"""
        return db.exec(
            select(Post)
            .where(Post.slug == slug)
            .where(Post.tenant_id == tenant_id)
            .where(Post.property_id == property_id)
            .where(Post.feature_id == feature_id)
        ).first()

    def get_published(self, db: Session, *, tenant_id: int, property_id: Optional[int] = None, feature_id: Optional[int] = None) -> List[Post]:
        """Get published posts"""
        query = select(Post).where(Post.tenant_id == tenant_id).where(Post.status == 'published')
        
        if property_id:
            query = query.where(Post.property_id == property_id)
        if feature_id:
            query = query.where(Post.feature_id == feature_id)
            
        return db.exec(query.order_by(Post.pinned.desc(), Post.published_at.desc())).all()

    def get_by_feature(self, db: Session, *, feature_id: int, tenant_id: int) -> List[Post]:
        """Get posts by feature"""
        return db.exec(
            select(Post)
            .where(Post.feature_id == feature_id)
            .where(Post.tenant_id == tenant_id)
            .order_by(Post.pinned.desc(), Post.created_at.desc())
        ).all()

    def get_by_tenant(self, db: Session, *, tenant_id: int, property_id: Optional[int] = None, feature_id: Optional[int] = None, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Post]:
        """Get posts by tenant with optional filters"""
        query = select(Post).where(Post.tenant_id == tenant_id)
        
        if property_id:
            query = query.where(Post.property_id == property_id)
        if feature_id:
            query = query.where(Post.feature_id == feature_id)
        if status:
            query = query.where(Post.status == status)
            
        return db.exec(query.order_by(Post.pinned.desc(), Post.created_at.desc()).offset(skip).limit(limit)).all()

    def get_by_tenant_with_translations(self, db: Session, *, tenant_id: int, property_id: Optional[int] = None, feature_id: Optional[int] = None, status: Optional[str] = None, locale: str = "en", skip: int = 0, limit: int = 100) -> List[dict]:
        """Get posts by tenant with translation data"""
        print(f"[CRUD-DEBUG] get_by_tenant_with_translations called (tenant_id={tenant_id}, locale={locale}, feature_id={feature_id}, skip={skip}, limit={limit})", flush=True)
        query = select(Post, PostTranslation).join(
            PostTranslation, Post.id == PostTranslation.post_id
        ).where(
            Post.tenant_id == tenant_id,
            PostTranslation.locale == locale
        )
        
        if property_id:
            query = query.where(Post.property_id == property_id)
        if feature_id:
            query = query.where(Post.feature_id == feature_id)
        if status:
            query = query.where(Post.status == status)
            
        # Debug: also check raw posts (without translations) for the same filters
        try:
            raw_query = select(Post).where(Post.tenant_id == tenant_id)
            if property_id:
                raw_query = raw_query.where(Post.property_id == property_id)
            if feature_id:
                raw_query = raw_query.where(Post.feature_id == feature_id)
            if status:
                raw_query = raw_query.where(Post.status == status)

            raw_posts = db.exec(raw_query.order_by(Post.created_at.desc()).offset(skip).limit(limit)).all()
            raw_ids = [p.id for p in raw_posts]
            print(f"🔎 Raw posts matching tenant/filters: {len(raw_posts)} ids={raw_ids}", flush=True)
        except Exception as e:
            print(f"❌ Error querying raw posts: {e}", flush=True)

        results = db.exec(query.offset(skip).limit(limit).order_by(Post.pinned.desc(), Post.created_at.desc())).all()
        
        # Combine post and translation data
        posts_with_translations = []
        for post, translation in results:
            post_dict = {
                "id": post.id,
                "tenant_id": post.tenant_id,
                "property_id": post.property_id, 
                "feature_id": post.feature_id,
                "slug": post.slug,
                "status": post.status,
                "pinned": post.pinned,
                "cover_media_id": post.cover_media_id,
                "published_at": post.published_at,
                "created_by": post.created_by,
                "created_at": post.created_at,
                "updated_at": post.updated_at,
                "title": translation.title,
                "content_html": translation.content_html,
                "locale": translation.locale
            }
            posts_with_translations.append(post_dict)
            
        return posts_with_translations

    def get_by_tenant_with_all_translations(self, db: Session, *, tenant_id: int, property_id: Optional[int] = None, feature_id: Optional[int] = None, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[dict]:
        """Get posts by tenant and include all translations as a translations list per post."""
        query = select(Post, PostTranslation).join(
            PostTranslation, Post.id == PostTranslation.post_id
        ).where(
            Post.tenant_id == tenant_id
        )

        if property_id:
            query = query.where(Post.property_id == property_id)
        if feature_id:
            query = query.where(Post.feature_id == feature_id)
        if status:
            query = query.where(Post.status == status)

        results = db.exec(query.order_by(Post.pinned.desc(), Post.created_at.desc()).offset(skip).limit(limit)).all()

        posts_map: Dict[int, dict] = {}
        for post, translation in results:
            if post.id not in posts_map:
                posts_map[post.id] = {
                    "id": post.id,
                    "tenant_id": post.tenant_id,
                    "property_id": post.property_id,
                    "feature_id": post.feature_id,
                    "slug": post.slug,
                    "status": post.status,
                    "pinned": post.pinned,
                    "cover_media_id": post.cover_media_id,
                    "published_at": post.published_at,
                    "created_by": post.created_by,
                    "created_at": post.created_at,
                    "updated_at": post.updated_at,
                    # default title/content will be omitted when returning all translations;
                    # include translations array instead so callers can pick the locale they need
                    "translations": []
                }

            # Append translation object
            posts_map[post.id]["translations"].append({
                "locale": translation.locale,
                "title": translation.title,
                "subtitle": getattr(translation, 'subtitle', None),
                "content_html": translation.content_html,
                "seo_title": getattr(translation, 'seo_title', None),
                "seo_desc": getattr(translation, 'seo_desc', None),
                "og_image_id": getattr(translation, 'og_image_id', None),
            })

        # Return list of posts with translations
        return list(posts_map.values())

    def get_by_tenant_with_all_translations(self, db: Session, *, tenant_id: int, property_id: Optional[int] = None, feature_id: Optional[int] = None, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[dict]:
        """Get posts by tenant and include all translations for each post (returns translations list)"""
        print(f"[CRUD-DEBUG] get_by_tenant_with_all_translations called (tenant_id={tenant_id}, feature_id={feature_id}, skip={skip}, limit={limit})", flush=True)
        # First select the posts themselves (apply ordering + paging at post level)
        posts_query = select(Post).where(Post.tenant_id == tenant_id)

        if property_id:
            posts_query = posts_query.where(Post.property_id == property_id)
        if feature_id:
            posts_query = posts_query.where(Post.feature_id == feature_id)
        if status:
            posts_query = posts_query.where(Post.status == status)

        posts_list = db.exec(posts_query.order_by(Post.pinned.desc(), Post.created_at.desc()).offset(skip).limit(limit)).all()

        # No posts -> empty result
        if not posts_list:
            return []

        post_ids = [p.id for p in posts_list]

        # Load all translations for the selected posts in one query
        translations_query = select(PostTranslation).where(PostTranslation.post_id.in_(post_ids))
        translations = db.exec(translations_query).all()
        print(f"[CRUD-DEBUG] translations fetched: {len(translations)} for post_ids={post_ids}", flush=True)

        # Group translations by post_id
        translations_map: Dict[int, List[PostTranslation]] = {}
        for t in translations:
            translations_map.setdefault(t.post_id, []).append(t)

        # Build final result preserving post ordering
        results: List[dict] = []
        for post in posts_list:
            post_entry = {
                "id": post.id,
                "tenant_id": post.tenant_id,
                "property_id": post.property_id,
                "feature_id": post.feature_id,
                "slug": post.slug,
                "status": post.status,
                "pinned": post.pinned,
                "cover_media_id": post.cover_media_id,
                "published_at": post.published_at,
                "created_by": post.created_by,
                "created_at": post.created_at,
                "updated_at": post.updated_at,
                "translations": []
            }

            for translation in translations_map.get(post.id, []):
                post_entry["translations"].append({
                    "locale": translation.locale,
                    "title": translation.title,
                    "subtitle": getattr(translation, 'subtitle', None),
                    "content_html": translation.content_html,
                    "seo_title": getattr(translation, 'seo_title', None),
                    "seo_desc": getattr(translation, 'seo_desc', None),
                    "og_image_id": getattr(translation, 'og_image_id', None),
                })

            results.append(post_entry)

        return results

        # Fallback: if no posts found in posts/post_translations, try property_posts
        # This helps compatibility when legacy data exists in property_posts tables
        # instead of the canonical posts/post_translations tables.
        if len(posts_with_translations) == 0:
            try:
                print("🔁 No posts found in posts/post_translations, attempting property_posts fallback", flush=True)
                # Note: property_posts don't have a feature_id column. For compatibility
                # with the Features UI we will map the requested feature_id into the
                # returned rows so the frontend can display legacy content under a
                # given feature. This is a temporary compatibility shim; consider
                # migrating data into posts/post_translations long-term.

                conn = db.get_bind()
                sql = text(
                    "SELECT p.id AS id, pr.tenant_id AS tenant_id, p.property_id AS property_id, :feature_id AS feature_id, NULL AS slug, "
                    "p.status AS status, 0 AS pinned, NULL AS cover_media_id, NULL AS published_at, NULL AS created_by, "
                    "p.created_at AS created_at, p.updated_at AS updated_at, t.content AS content_html, t.locale AS locale "
                    "FROM property_posts p "
                    "INNER JOIN property_post_translations t ON p.id = t.post_id "
                    "INNER JOIN properties pr ON p.property_id = pr.id "
                    "WHERE pr.tenant_id = :tenant_id AND t.locale = :locale"
                )

                params = {"tenant_id": tenant_id, "locale": locale}
                if property_id:
                    sql = text(sql.text + " AND p.property_id = :property_id")
                    params["property_id"] = property_id
                if status:
                    sql = text(sql.text + " AND p.status = :status")
                    params["status"] = status

                # Add limit/offset
                sql = text(sql.text + " LIMIT :limit OFFSET :skip")
                params["limit"] = limit
                params["skip"] = skip

                result = conn.execute(sql, params)
                fallback_posts = []
                for row in result.fetchall():
                    content = row.content_html or ""
                    # Fallback title: use first 50 chars of content or a placeholder
                    fallback_title = (content.strip()[:50] + "...") if len(content.strip()) > 50 else content.strip() or "Untitled post"
                    # Generate a slug fallback if missing
                    fallback_slug = f"legacy-post-{row.id}"
                    fallback_posts.append({
                        "id": row.id,
                        "tenant_id": row.tenant_id,
                        "property_id": row.property_id,
                        "feature_id": row.feature_id,
                        "slug": fallback_slug,
                        "status": row.status,
                        "pinned": bool(row.pinned),
                        "cover_media_id": row.cover_media_id,
                        "published_at": row.published_at,
                        "created_by": row.created_by,
                        "created_at": row.created_at,
                        "updated_at": row.updated_at,
                        "title": fallback_title,
                        "content_html": row.content_html,
                        "locale": row.locale,
                    })

                if fallback_posts:
                    print(f"✅ Found {len(fallback_posts)} posts via property_posts fallback", flush=True)
                    return fallback_posts
            except Exception as e:
                print(f"❌ Error during property_posts fallback: {e}", flush=True)

        return posts_with_translations

    def get_with_translation(self, db: Session, *, post_id: int, locale: str = "en") -> Optional[dict]:
        """Get single post with translation data"""
        result = db.exec(
            select(Post, PostTranslation).join(
                PostTranslation, Post.id == PostTranslation.post_id
            ).where(
                Post.id == post_id,
                PostTranslation.locale == locale
            )
        ).first()
        
        if not result:
            return None
            
        post, translation = result
        return {
            "id": post.id,
            "tenant_id": post.tenant_id,
            "property_id": post.property_id, 
            "feature_id": post.feature_id,
            "slug": post.slug,
            "status": post.status,
            "pinned": post.pinned,
            "cover_media_id": post.cover_media_id,
            "published_at": post.published_at,
            "created_by": post.created_by,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "title": translation.title,
            "content_html": translation.content_html,
            "locale": translation.locale
        }


class CRUDPostTranslation(CRUDBase[PostTranslation, PostTranslationCreate, PostTranslationUpdate]):
    def get_by_post_locale(self, db: Session, *, post_id: int, locale: str) -> Optional[PostTranslation]:
        """Get translation by post and locale"""
        return db.exec(
            select(PostTranslation)
            .where(PostTranslation.post_id == post_id)
            .where(PostTranslation.locale == locale)
        ).first()


class CRUDMediaFile(CRUDBase[MediaFile, MediaFileCreate, MediaFileUpdate]):
    def get_by_kind(self, db: Session, *, kind: str, tenant_id: int) -> List[MediaFile]:
        """Get media files by kind"""
        return db.exec(
            select(MediaFile)
            .where(MediaFile.kind == kind)
            .where(MediaFile.tenant_id == tenant_id)
            .order_by(MediaFile.created_at.desc())
        ).all()

    def get_by_tenant(self, db: Session, *, tenant_id: int, kind: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[MediaFile]:
        """Get media files by tenant, optionally filtered by kind"""
        query = select(MediaFile).where(MediaFile.tenant_id == tenant_id)
        if kind:
            query = query.where(MediaFile.kind == kind)
        return db.exec(query.order_by(MediaFile.created_at.desc()).offset(skip).limit(limit)).all()


class CRUDPostMedia(CRUDBase[PostMedia, PostMediaCreate, PostMediaUpdate]):
    def get_by_post(self, db: Session, *, post_id: int) -> List[PostMedia]:
        """Get media files for a post"""
        return db.exec(
            select(PostMedia)
            .where(PostMedia.post_id == post_id)
            .order_by(PostMedia.sort_order)
        ).all()


class CRUDEvent(CRUDBase[Event, EventCreate, None]):
    def get_by_tenant(self, db: Session, *, tenant_id: int, event_type: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Event]:
        """Get events by tenant"""
        query = select(Event).where(Event.tenant_id == tenant_id)
        if event_type:
            query = query.where(Event.event_type == event_type)
        
        return db.exec(query.order_by(Event.created_at.desc()).offset(skip).limit(limit)).all()


class CRUDSetting(CRUDBase[Setting, SettingCreate, SettingUpdate]):
    def get_by_key(self, db: Session, *, key_name: str, tenant_id: int = 0, property_id: int = 0) -> Optional[Setting]:
        """Get setting by key"""
        return db.exec(
            select(Setting)
            .where(Setting.key_name == key_name)
            .where(Setting.tenant_id == tenant_id)
            .where(Setting.property_id == property_id)
        ).first()

    def get_tenant_settings(self, db: Session, *, tenant_id: int) -> List[Setting]:
        """Get all tenant settings"""
        return db.exec(
            select(Setting)
            .where(Setting.tenant_id == tenant_id)
            .where(Setting.property_id == 0)
        ).all()

    def get_property_settings(self, db: Session, *, tenant_id: int, property_id: int) -> List[Setting]:
        """Get property settings"""
        return db.exec(
            select(Setting)
            .where(Setting.tenant_id == tenant_id)
            .where(Setting.property_id == property_id)
        ).all()


class CRUDPropertyTranslation(CRUDBase[PropertyTranslation, PropertyTranslationCreate, PropertyTranslationUpdate]):
    def get_by_property_and_locale(
        self, db: Session, *, property_id: int, locale: str
    ) -> Optional[PropertyTranslation]:
        """Get translation by property ID and locale"""
        return db.exec(
            select(PropertyTranslation)
            .where(PropertyTranslation.property_id == property_id)
            .where(PropertyTranslation.locale == locale)
        ).first()

    def get_by_property(
        self, db: Session, *, property_id: int
    ) -> List[PropertyTranslation]:
        """Get all translations for a property"""
        return db.exec(
            select(PropertyTranslation)
            .where(PropertyTranslation.property_id == property_id)
        ).all()

    def create_translation(
        self, db: Session, *, property_id: int, obj_in: PropertyTranslationCreate
    ) -> PropertyTranslation:
        """Create a new translation for a property"""
        # Check if translation already exists
        existing = self.get_by_property_and_locale(
            db, property_id=property_id, locale=obj_in.locale
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Translation for locale '{obj_in.locale}' already exists"
            )

        obj_in.property_id = property_id
        return self.create(db, obj_in=obj_in)

    def update_translation(
        self, db: Session, *, property_id: int, locale: str, obj_in: PropertyTranslationUpdate
    ) -> PropertyTranslation:
        """Update an existing translation"""
        db_obj = self.get_by_property_and_locale(
            db, property_id=property_id, locale=locale
        )
        if not db_obj:
            raise HTTPException(
                status_code=404,
                detail=f"Translation for locale '{locale}' not found"
            )

        return self.update(db, db_obj=db_obj, obj_in=obj_in)

    def delete_translation(
        self, db: Session, *, property_id: int, locale: str
    ) -> None:
        """Delete a translation"""
        db_obj = self.get_by_property_and_locale(
            db, property_id=property_id, locale=locale
        )
        if not db_obj:
            raise HTTPException(
                status_code=404,
                detail=f"Translation for locale '{locale}' not found"
            )

        db.delete(db_obj)
        db.commit()


# Create instances
property = CRUDProperty(Property)
property_translation = CRUDPropertyTranslation(PropertyTranslation)
feature_category = CRUDFeatureCategory(FeatureCategory)
feature_category_translation = CRUDFeatureCategoryTranslation(FeatureCategoryTranslation)
feature = CRUDFeature(Feature)
feature_translation = CRUDFeatureTranslation(FeatureTranslation)
property_category = CRUDPropertyCategory(PropertyCategory)
property_feature = CRUDPropertyFeature(PropertyFeature)
post = CRUDPost(Post)
post_translation = CRUDPostTranslation(PostTranslation)
media_file = CRUDMediaFile(MediaFile)
post_media = CRUDPostMedia(PostMedia)
event = CRUDEvent(Event)
setting = CRUDSetting(Setting)