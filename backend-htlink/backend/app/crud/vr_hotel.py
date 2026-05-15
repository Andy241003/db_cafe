"""
CRUD operations for VR Hotel models
Following the base CRUD pattern used in Travel Link
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Session, select
from app.crud.base import CRUDBase
from app.models.vr_hotel import (
    VRHotelSettings,
    VRHotelContact,
    VRHotelSEO,
    VRRoom,
    VRRoomTranslation,
    VRRoomMedia,
    VRDining,
    VRDiningTranslation,
    VRDiningMedia,
    VRFacility,
    VRFacilityTranslation,
    VRFacilityMedia,
    VROffer,
    VROfferTranslation,
    VRContent,
    PropertyLocale,
    VR360Scene
)
from app.schemas.vr_hotel import (
    VRHotelSettingsCreate,
    VRHotelSettingsUpdate,
    VRRoomCreate,
    VRRoomUpdate,
    VRDiningCreate,
    VRDiningUpdate,
    VRFacilityCreate,
    VRFacilityUpdate,
    VROfferCreate,
    VROfferUpdate
)


# ==========================================
# VR Hotel Settings CRUD
# ==========================================

class CRUDVRHotelSettings(CRUDBase[VRHotelSettings, VRHotelSettingsCreate, VRHotelSettingsUpdate]):
    def get_by_property(
        self, 
        db: Session, 
        *, 
        tenant_id: int, 
        property_id: int
    ) -> Optional[VRHotelSettings]:
        """Get VR Hotel settings for a specific property"""
        return db.exec(
            select(VRHotelSettings)
            .where(VRHotelSettings.tenant_id == tenant_id)
            .where(VRHotelSettings.property_id == property_id)
        ).first()
    
    def get_or_create(
        self,
        db: Session,
        *,
        tenant_id: int,
        property_id: int,
        defaults: Optional[Dict[str, Any]] = None
    ) -> tuple[VRHotelSettings, bool]:
        """
        Get existing settings or create with defaults
        Returns: (settings, created) - created=True if new record was created
        """
        existing = self.get_by_property(db, tenant_id=tenant_id, property_id=property_id)
        
        if existing:
            return existing, False
        
        # Create new settings with defaults
        create_data = {
            "tenant_id": tenant_id,
            "property_id": property_id,
            **(defaults or {})
        }
        
        new_settings = VRHotelSettings(**create_data)
        db.add(new_settings)
        db.commit()
        db.refresh(new_settings)
        
        return new_settings, True


# ==========================================
# VR Hotel Contact CRUD
# ==========================================

class CRUDVRHotelContact(CRUDBase[VRHotelContact, Any, Any]):
    def get_by_property(
        self, 
        db: Session, 
        *, 
        tenant_id: int, 
        property_id: int
    ) -> Optional[VRHotelContact]:
        """Get contact info for a specific property"""
        return db.exec(
            select(VRHotelContact)
            .where(VRHotelContact.tenant_id == tenant_id)
            .where(VRHotelContact.property_id == property_id)
        ).first()


# ==========================================
# VR Hotel SEO CRUD
# ==========================================

class CRUDVRHotelSEO(CRUDBase[VRHotelSEO, Any, Any]):
    def get_by_property_and_locale(
        self, 
        db: Session, 
        *, 
        tenant_id: int, 
        property_id: int,
        locale: str
    ) -> Optional[VRHotelSEO]:
        """Get SEO for specific property and locale"""
        return db.exec(
            select(VRHotelSEO)
            .where(VRHotelSEO.tenant_id == tenant_id)
            .where(VRHotelSEO.property_id == property_id)
            .where(VRHotelSEO.locale == locale)
        ).first()
    
    def get_all_by_property(
        self, 
        db: Session, 
        *, 
        tenant_id: int, 
        property_id: int
    ) -> List[VRHotelSEO]:
        """Get all SEO records for a property"""
        return list(db.exec(
            select(VRHotelSEO)
            .where(VRHotelSEO.tenant_id == tenant_id)
            .where(VRHotelSEO.property_id == property_id)
        ).all())


# ==========================================
# VR Room CRUD
# ==========================================

class CRUDVRRoom(CRUDBase[VRRoom, VRRoomCreate, VRRoomUpdate]):
    def get_multi_by_property(
        self,
        db: Session,
        *,
        tenant_id: int,
        property_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[VRRoom]:
        """Get rooms for a specific property with optional status filter"""
        query = select(VRRoom).where(
            VRRoom.tenant_id == tenant_id,
            VRRoom.property_id == property_id
        )
        
        if status:
            query = query.where(VRRoom.status == status)
        
        query = query.offset(skip).limit(limit).order_by(VRRoom.display_order)
        
        return list(db.exec(query).all())
    
    def get_with_translations(
        self,
        db: Session,
        *,
        room_id: int
    ) -> Optional[VRRoom]:
        """Get room with all translations loaded"""
        # SQLModel will automatically load relationships if defined
        return db.get(VRRoom, room_id)


# ==========================================
# VR Dining CRUD
# ==========================================

class CRUDVRDining(CRUDBase[VRDining, VRDiningCreate, VRDiningUpdate]):
    def get_multi_by_property(
        self,
        db: Session,
        *,
        tenant_id: int,
        property_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[VRDining]:
        """Get dining options for a specific property"""
        query = select(VRDining).where(
            VRDining.tenant_id == tenant_id,
            VRDining.property_id == property_id
        )
        
        if status:
            query = query.where(VRDining.status == status)
        
        query = query.offset(skip).limit(limit).order_by(VRDining.display_order)
        
        return list(db.exec(query).all())


# ==========================================
# VR Facility CRUD
# ==========================================

class CRUDVRFacility(CRUDBase[VRFacility, VRFacilityCreate, VRFacilityUpdate]):
    def get_multi_by_property(
        self,
        db: Session,
        *,
        tenant_id: int,
        property_id: int,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None
    ) -> List[VRFacility]:
        """Get facilities for a specific property with optional category filter"""
        query = select(VRFacility).where(
            VRFacility.tenant_id == tenant_id,
            VRFacility.property_id == property_id
        )
        
        if category:
            query = query.where(VRFacility.category == category)
        
        query = query.offset(skip).limit(limit).order_by(VRFacility.display_order)
        
        return list(db.exec(query).all())


# ==========================================
# VR Offer CRUD
# ==========================================

class CRUDVROffer(CRUDBase[VROffer, VROfferCreate, VROfferUpdate]):
    def get_multi_by_property(
        self,
        db: Session,
        *,
        tenant_id: int,
        property_id: int,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False
    ) -> List[VROffer]:
        """Get offers for a specific property"""
        query = select(VROffer).where(
            VROffer.tenant_id == tenant_id,
            VROffer.property_id == property_id
        )
        
        if active_only:
            query = query.where(VROffer.is_active == True)
        
        query = query.offset(skip).limit(limit).order_by(VROffer.display_order)
        
        return list(db.exec(query).all())


# ==========================================
# VR360 Scene CRUD
# ==========================================

class CRUDVR360Scene(CRUDBase[VR360Scene, Any, Any]):
    def get_by_tenant_and_scene_id(
        self,
        db: Session,
        *,
        tenant_id: int,
        property_id: Optional[int],
        scene_id: str
    ) -> Optional[VR360Scene]:
        """Get a specific scene by tenant, optional property, and scene_id"""
        query = select(VR360Scene).where(
            VR360Scene.tenant_id == tenant_id,
            VR360Scene.scene_id == scene_id
        )
        if property_id is not None:
            query = query.where(VR360Scene.property_id == property_id)
        else:
            query = query.where(VR360Scene.property_id.is_(None))
        return db.exec(query).first()

    def get_active_by_tenant(
        self,
        db: Session,
        *,
        tenant_id: int,
        property_id: Optional[int]
    ) -> List[VR360Scene]:
        """Get all active scenes for a tenant, optionally filtered by property."""
        query = select(VR360Scene).where(
            VR360Scene.tenant_id == tenant_id,
            VR360Scene.is_active == True
        )
        if property_id is not None:
            query = query.where(VR360Scene.property_id == property_id)
        else:
            query = query.where(VR360Scene.property_id.is_(None))
        query = query.order_by(VR360Scene.display_order)
        return list(db.exec(query).all())

    def sync_scenes(
        self,
        db: Session,
        *,
        tenant_id: int,
        property_id: Optional[int],
        scenes_data: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """
        Sync scenes from frontend payload.
        Returns counts of created, updated, deactivated scenes.
        """
        created = 0
        updated = 0
        deactivated = 0

        existing_scenes = self.get_active_by_tenant(db=db, tenant_id=tenant_id, property_id=property_id)

        # Process incoming scenes
        incoming_scene_ids = set()
        for scene_data in scenes_data:
            scene_id = scene_data["id"]
            incoming_scene_ids.add(scene_id)

            # Check if scene exists
            existing_scene = self.get_by_tenant_and_scene_id(
                db=db,
                tenant_id=tenant_id,
                property_id=property_id,
                scene_id=scene_id
            )

            if existing_scene:
                # Update existing scene
                existing_scene.scene_name = scene_data["name"]
                existing_scene.scene_subtitle = scene_data.get("subtitle")
                existing_scene.panorama_url = scene_data.get("panorama_url")
                existing_scene.display_order = scene_data["order"]
                existing_scene.is_active = True
                existing_scene.updated_at = datetime.utcnow()
                db.add(existing_scene)
                updated += 1
            else:
                # Create new scene
                new_scene = VR360Scene(
                    tenant_id=tenant_id,
                    property_id=property_id,
                    scene_id=scene_id,
                    scene_name=scene_data["name"],
                    scene_subtitle=scene_data.get("subtitle"),
                    panorama_url=scene_data.get("panorama_url"),
                    display_order=scene_data["order"],
                    is_active=True
                )
                db.add(new_scene)
                created += 1

        # Deactivate scenes not in the payload
        for scene in existing_scenes:
            if scene.scene_id not in incoming_scene_ids:
                scene.is_active = False
                scene.updated_at = datetime.utcnow()
                db.add(scene)
                deactivated += 1

        db.commit()

        return {
            "created": created,
            "updated": updated,
            "deactivated": deactivated
        }


# ==========================================
# Instantiate CRUD objects
# ==========================================

vr_hotel_settings = CRUDVRHotelSettings(VRHotelSettings)
vr_hotel_contact = CRUDVRHotelContact(VRHotelContact)
vr_hotel_seo = CRUDVRHotelSEO(VRHotelSEO)
vr_room = CRUDVRRoom(VRRoom)
vr_dining = CRUDVRDining(VRDining)
vr_facility = CRUDVRFacility(VRFacility)
vr_offer = CRUDVROffer(VROffer)
vr360_scene = CRUDVR360Scene(VR360Scene)
