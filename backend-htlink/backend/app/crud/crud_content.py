from typing import Optional, List, Dict, Any
from sqlmodel import Session, select
from .base import CRUDBase
from ..models import (
    Property, FeatureCategory, FeatureCategoryTranslation,
    Feature, FeatureTranslation, PropertyCategory, PropertyFeature,
    Post, PostTranslation, MediaFile, PostMedia, Event, Setting
)
from ..schemas import (
    PropertyCreate, PropertyUpdate,
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


# Create instances
property = CRUDProperty(Property)
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