"""
VR Hotel Property Export/Import API endpoints
"""
import io
import json
import zipfile
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import SessionDep, CurrentUser
from app.models import Property, AdminUser
from app.models.vr_hotel import (
    VRRoom, VRRoomTranslation,
    VRDining, VRDiningTranslation,
    VRService, VRServiceTranslation,
    VRFacility, VRFacilityTranslation,
    VRHotelIntroduction,
    VRHotelPolicies,
    VRHotelRules,
    VRHotelContact,
    VRHotelSEO,
    VRHotelSettings,
    PropertyLocale
)

router = APIRouter()


@router.post("/export")
async def export_property_template(
    *,
    db: SessionDep,
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
) -> StreamingResponse:
    """
    Export current property data to ZIP file (JSON + images)
    """
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    property_id = x_property_id
    
    # Get property info
    property_obj = db.query(Property).filter(
        Property.id == property_id,
        Property.tenant_id == current_user.tenant_id
    ).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get locales
    locales = db.query(PropertyLocale).filter(
        PropertyLocale.property_id == property_id,
        PropertyLocale.is_active == True
    ).all()
    
    export_data = {
        "export_version": "1.0",
        "export_date": datetime.utcnow().isoformat(),
        "source_property": {
            "name": property_obj.property_name,
            "id": property_id
        },
        "locales": [{"code": loc.locale_code, "is_default": loc.is_default} for loc in locales],
        "introduction": None,
        "policies": None,
        "rules": None,
        "contact": None,
        "seo": [],
        "settings": None,
        "rooms": [],
        "dining": [],
        "services": [],
        "facilities": []
    }
    
    # Export introduction
    introduction = db.query(VRHotelIntroduction).filter(VRHotelIntroduction.property_id == property_id).first()
    if introduction:
        export_data["introduction"] = {
            "is_displaying": introduction.is_displaying,
            "vr360_link": introduction.vr360_link,
            "vr_title": introduction.vr_title,
            "content_json": introduction.content_json
        }
    
    # Export policies
    policies = db.query(VRHotelPolicies).filter(VRHotelPolicies.property_id == property_id).first()
    if policies:
        export_data["policies"] = {
            "is_displaying": policies.is_displaying,
            "vr360_link": policies.vr360_link,
            "vr_title": policies.vr_title,
            "content_json": policies.content_json
        }
    
    # Export rules
    rules = db.query(VRHotelRules).filter(VRHotelRules.property_id == property_id).first()
    if rules:
        export_data["rules"] = {
            "is_displaying": rules.is_displaying,
            "vr360_link": rules.vr360_link,
            "vr_title": rules.vr_title,
            "content_json": rules.content_json
        }
    
    # Export contact
    contact = db.query(VRHotelContact).filter(VRHotelContact.property_id == property_id).first()
    if contact:
        export_data["contact"] = {
            "is_displaying": contact.is_displaying,
            "phone": contact.phone,
            "email": contact.email,
            "website": contact.website,
            "address_json": contact.address_json,
            "social_media_json": contact.social_media_json,
            "working_hours_json": contact.working_hours_json,
            "content_json": contact.content_json,
            "map_coordinates": contact.map_coordinates,
            "vr360_link": contact.vr360_link,
            "vr_title": contact.vr_title
        }
    
    # Export SEO (per locale)
    seo_list = db.query(VRHotelSEO).filter(VRHotelSEO.property_id == property_id).all()
    for seo in seo_list:
        export_data["seo"].append({
            "locale": seo.locale,
            "meta_title": seo.meta_title,
            "meta_description": seo.meta_description,
            "meta_keywords": seo.meta_keywords
        })
    
    # Export settings
    settings = db.query(VRHotelSettings).filter(VRHotelSettings.property_id == property_id).first()
    if settings:
        export_data["settings"] = {
            "primary_color": settings.primary_color,
            "booking_url": settings.booking_url,
            "messenger_url": settings.messenger_url,
            "phone_number": settings.phone_number,
            "settings_json": settings.settings_json
        }
    
    # Export rooms
    rooms = db.query(VRRoom).filter(VRRoom.property_id == property_id).all()
    for idx, room in enumerate(rooms, 1):
        room_data = {
            "id": f"room_{idx}",
            "room_code": room.room_code,
            "room_type": room.room_type,
            "floor": room.floor,
            "bed_type": room.bed_type,
            "capacity": room.capacity,
            "size_sqm": float(room.size_sqm) if room.size_sqm else None,
            "price_per_night": float(room.price_per_night) if room.price_per_night else None,
            "vr_link": room.vr_link,
            "booking_url": room.booking_url,
            "status": room.status,
            "amenities": room.amenities_json,
            "attributes_json": room.attributes_json,
            "display_order": room.display_order,
            "translations": {}
        }
        
        # Get translations
        translations = db.query(VRRoomTranslation).filter(
            VRRoomTranslation.room_id == room.id
        ).all()
        for trans in translations:
            room_data["translations"][trans.locale] = {
                "name": trans.name,
                "description": trans.description,
                "amenities_text": trans.amenities_text
            }
        
        export_data["rooms"].append(room_data)
    
    # Export dining
    dinings = db.query(VRDining).filter(VRDining.property_id == property_id).all()
    for idx, dining in enumerate(dinings, 1):
        dining_data = {
            "id": f"dining_{idx}",
            "code": dining.code,
            "dining_type": dining.dining_type,
            "cuisine_types": dining.cuisine_types,
            "capacity": dining.capacity,
            "operating_hours": dining.operating_hours,
            "vr_link": dining.vr_link,
            "booking_url": dining.booking_url,
            "status": dining.status,
            "attributes_json": dining.attributes_json,
            "display_order": dining.display_order,
            "translations": {}
        }
        
        translations = db.query(VRDiningTranslation).filter(
            VRDiningTranslation.dining_id == dining.id
        ).all()
        for trans in translations:
            dining_data["translations"][trans.locale] = {
                "name": trans.name,
                "description": trans.description
            }
        
        export_data["dining"].append(dining_data)
    
    # Export services
    services = db.query(VRService).filter(VRService.property_id == property_id).all()
    for idx, service in enumerate(services, 1):
        service_data = {
            "id": f"service_{idx}",
            "code": service.code,
            "service_type": service.service_type,
            "availability": service.availability,
            "price_info": service.price_info,
            "vr_link": service.vr_link,
            "booking_url": service.booking_url,
            "status": service.status,
            "attributes_json": service.attributes_json,
            "display_order": service.display_order,
            "translations": {}
        }
        
        translations = db.query(VRServiceTranslation).filter(
            VRServiceTranslation.service_id == service.id
        ).all()
        for trans in translations:
            service_data["translations"][trans.locale] = {
                "name": trans.name,
                "description": trans.description
            }
        
        export_data["services"].append(service_data)
    
    # Export facilities
    facilities = db.query(VRFacility).filter(VRFacility.property_id == property_id).all()
    for idx, facility in enumerate(facilities, 1):
        facility_data = {
            "id": f"facility_{idx}",
            "code": facility.code,
            "facility_type": facility.facility_type,
            "operating_hours": facility.operating_hours,
            "vr_link": facility.vr_link,
            "status": facility.status,
            "attributes_json": facility.attributes_json,
            "display_order": facility.display_order,
            "translations": {}
        }
        
        translations = db.query(VRFacilityTranslation).filter(
            VRFacilityTranslation.facility_id == facility.id
        ).all()
        for trans in translations:
            facility_data["translations"][trans.locale] = {
                "name": trans.name,
                "description": trans.description
            }
        
        export_data["facilities"].append(facility_data)
    
    # Create metadata
    metadata = {
        "version": "1.0",
        "export_date": datetime.utcnow().isoformat(),
        "source_property": property_obj.property_name,
        "total_items": {
            "introduction": 1 if export_data["introduction"] else 0,
            "policies": 1 if export_data["policies"] else 0,
            "rules": 1 if export_data["rules"] else 0,
            "contact": 1 if export_data["contact"] else 0,
            "seo": len(export_data["seo"]),
            "settings": 1 if export_data["settings"] else 0,
            "rooms": len(rooms),
            "dining": len(dinings),
            "services": len(services),
            "facilities": len(facilities)
        }
    }
    
    # Create ZIP file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr('metadata.json', json.dumps(metadata, indent=2, ensure_ascii=False))
        zip_file.writestr('data.json', json.dumps(export_data, indent=2, ensure_ascii=False))
        zip_file.writestr('README.txt', 'Property Template Export\nImport this file to quickly set up a new property.')
    
    zip_buffer.seek(0)
    
    filename = f"property-{property_obj.code}-{datetime.utcnow().strftime('%Y%m%d')}.zip"
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/import-preview")
async def preview_import_template(
    *,
    db: SessionDep,
    file: UploadFile = File(...),
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
) -> Dict[str, Any]:
    """
    Preview import data without actually importing
    """
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    try:
        contents = await file.read()
        zip_buffer = io.BytesIO(contents)
        
        with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
            metadata = json.loads(zip_file.read('metadata.json'))
            data = json.loads(zip_file.read('data.json'))
        
        return {
            "status": "valid",
            "metadata": metadata,
            "summary": {
                "locales": len(data.get("locales", [])),
                "introduction": 1 if data.get("introduction") else 0,
                "policies": 1 if data.get("policies") else 0,
                "rules": 1 if data.get("rules") else 0,
                "contact": 1 if data.get("contact") else 0,
                "seo": len(data.get("seo", [])),
                "settings": 1 if data.get("settings") else 0,
                "rooms": len(data.get("rooms", [])),
                "dining": len(data.get("dining", [])),
                "services": len(data.get("services", [])),
                "facilities": len(data.get("facilities", []))
            },
            "source_property": data.get("source_property", {}),
            "warnings": [
                "Booking URLs will need to be updated after import",
                "Please review prices and adjust if needed"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file: {str(e)}")


@router.post("/import")
async def import_property_template(
    *,
    db: SessionDep,
    file: UploadFile = File(...),
    current_user: CurrentUser,
    x_property_id: Optional[int] = Header(None)
) -> Dict[str, Any]:
    """
    Import property template from ZIP file
    """
    if not x_property_id:
        raise HTTPException(status_code=400, detail="X-Property-Id header is required")
    
    property_id = x_property_id
    
    try:
        contents = await file.read()
        zip_buffer = io.BytesIO(contents)
        
        with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
            data = json.loads(zip_file.read('data.json'))
        
        summary = {
            "locales": 0,
            "introduction": 0,
            "policies": 0,
            "rules": 0,
            "contact": 0,
            "seo": 0,
            "settings": 0,
            "rooms": 0,
            "dining": 0,
            "services": 0,
            "facilities": 0
        }
        
        # Import locales first (required for translations)
        for locale_data in data.get("locales", []):
            locale_code = locale_data.get("code")
            is_default = locale_data.get("is_default", False)
            
            # Check if locale already exists for this property
            existing_locale = db.query(PropertyLocale).filter(
                PropertyLocale.property_id == property_id,
                PropertyLocale.locale_code == locale_code
            ).first()
            
            if not existing_locale:
                new_locale = PropertyLocale(
                    tenant_id=current_user.tenant_id,
                    property_id=property_id,
                    locale_code=locale_code,
                    is_default=is_default,
                    is_active=True
                )
                db.add(new_locale)
                summary["locales"] += 1
        
        db.flush()  # Ensure locales are created before translations
        
        # Import introduction
        intro_data = data.get("introduction")
        if intro_data:
            # Check if introduction already exists
            existing_intro = db.query(VRHotelIntroduction).filter(
                VRHotelIntroduction.property_id == property_id
            ).first()
            
            if existing_intro:
                # Update existing
                existing_intro.is_displaying = intro_data.get("is_displaying", True)
                existing_intro.vr360_link = intro_data.get("vr360_link")
                existing_intro.vr_title = intro_data.get("vr_title")
                existing_intro.content_json = intro_data.get("content_json", {})
                existing_intro.updated_at = datetime.utcnow()
            else:
                # Create new
                new_intro = VRHotelIntroduction(
                    tenant_id=current_user.tenant_id,
                    property_id=property_id,
                    is_displaying=intro_data.get("is_displaying", True),
                    vr360_link=intro_data.get("vr360_link"),
                    vr_title=intro_data.get("vr_title"),
                    content_json=intro_data.get("content_json", {})
                )
                db.add(new_intro)
            summary["introduction"] = 1
        
        # Import policies
        policies_data = data.get("policies")
        if policies_data:
            existing_policies = db.query(VRHotelPolicies).filter(
                VRHotelPolicies.property_id == property_id
            ).first()
            
            if existing_policies:
                existing_policies.is_displaying = policies_data.get("is_displaying", True)
                existing_policies.vr360_link = policies_data.get("vr360_link")
                existing_policies.vr_title = policies_data.get("vr_title")
                existing_policies.content_json = policies_data.get("content_json", {})
                existing_policies.updated_at = datetime.utcnow()
            else:
                new_policies = VRHotelPolicies(
                    tenant_id=current_user.tenant_id,
                    property_id=property_id,
                    is_displaying=policies_data.get("is_displaying", True),
                    vr360_link=policies_data.get("vr360_link"),
                    vr_title=policies_data.get("vr_title"),
                    content_json=policies_data.get("content_json", {})
                )
                db.add(new_policies)
            summary["policies"] = 1
        
        # Import rules
        rules_data = data.get("rules")
        if rules_data:
            existing_rules = db.query(VRHotelRules).filter(
                VRHotelRules.property_id == property_id
            ).first()
            
            if existing_rules:
                existing_rules.is_displaying = rules_data.get("is_displaying", True)
                existing_rules.vr360_link = rules_data.get("vr360_link")
                existing_rules.vr_title = rules_data.get("vr_title")
                existing_rules.content_json = rules_data.get("content_json", {})
                existing_rules.updated_at = datetime.utcnow()
            else:
                new_rules = VRHotelRules(
                    tenant_id=current_user.tenant_id,
                    property_id=property_id,
                    is_displaying=rules_data.get("is_displaying", True),
                    vr360_link=rules_data.get("vr360_link"),
                    vr_title=rules_data.get("vr_title"),
                    content_json=rules_data.get("content_json", {})
                )
                db.add(new_rules)
            summary["rules"] = 1
        
        # Import contact
        contact_data = data.get("contact")
        if contact_data:
            existing_contact = db.query(VRHotelContact).filter(
                VRHotelContact.property_id == property_id
            ).first()
            
            if existing_contact:
                existing_contact.is_displaying = contact_data.get("is_displaying", True)
                existing_contact.phone = contact_data.get("phone")
                existing_contact.email = contact_data.get("email")
                existing_contact.website = contact_data.get("website")
                existing_contact.address_json = contact_data.get("address_json")
                existing_contact.social_media_json = contact_data.get("social_media_json")
                existing_contact.working_hours_json = contact_data.get("working_hours_json")
                existing_contact.content_json = contact_data.get("content_json")
                existing_contact.map_coordinates = contact_data.get("map_coordinates")
                existing_contact.vr360_link = contact_data.get("vr360_link")
                existing_contact.vr_title = contact_data.get("vr_title")
                existing_contact.updated_at = datetime.utcnow()
            else:
                new_contact = VRHotelContact(
                    tenant_id=current_user.tenant_id,
                    property_id=property_id,
                    is_displaying=contact_data.get("is_displaying", True),
                    phone=contact_data.get("phone"),
                    email=contact_data.get("email"),
                    website=contact_data.get("website"),
                    address_json=contact_data.get("address_json"),
                    social_media_json=contact_data.get("social_media_json"),
                    working_hours_json=contact_data.get("working_hours_json"),
                    content_json=contact_data.get("content_json"),
                    map_coordinates=contact_data.get("map_coordinates"),
                    vr360_link=contact_data.get("vr360_link"),
                    vr_title=contact_data.get("vr_title")
                )
                db.add(new_contact)
            summary["contact"] = 1
        
        # Import SEO
        for seo_data in data.get("seo", []):
            locale = seo_data.get("locale")
            
            existing_seo = db.query(VRHotelSEO).filter(
                VRHotelSEO.property_id == property_id,
                VRHotelSEO.locale == locale
            ).first()
            
            if existing_seo:
                existing_seo.meta_title = seo_data.get("meta_title")
                existing_seo.meta_description = seo_data.get("meta_description")
                existing_seo.meta_keywords = seo_data.get("meta_keywords")
                existing_seo.updated_at = datetime.utcnow()
            else:
                new_seo = VRHotelSEO(
                    tenant_id=current_user.tenant_id,
                    property_id=property_id,
                    locale=locale,
                    meta_title=seo_data.get("meta_title"),
                    meta_description=seo_data.get("meta_description"),
                    meta_keywords=seo_data.get("meta_keywords")
                )
                db.add(new_seo)
            summary["seo"] += 1
        
        # Import settings
        settings_data = data.get("settings")
        if settings_data:
            existing_settings = db.query(VRHotelSettings).filter(
                VRHotelSettings.property_id == property_id
            ).first()
            
            if existing_settings:
                existing_settings.primary_color = settings_data.get("primary_color", "#3b82f6")
                existing_settings.booking_url = settings_data.get("booking_url")
                existing_settings.messenger_url = settings_data.get("messenger_url")
                existing_settings.phone_number = settings_data.get("phone_number")
                existing_settings.settings_json = settings_data.get("settings_json")
                existing_settings.updated_at = datetime.utcnow()
            else:
                new_settings = VRHotelSettings(
                    tenant_id=current_user.tenant_id,
                    property_id=property_id,
                    primary_color=settings_data.get("primary_color", "#3b82f6"),
                    booking_url=settings_data.get("booking_url"),
                    messenger_url=settings_data.get("messenger_url"),
                    phone_number=settings_data.get("phone_number"),
                    settings_json=settings_data.get("settings_json")
                )
                db.add(new_settings)
            summary["settings"] = 1
        
        db.flush()  # Ensure all base entities are created
        
        # Import rooms
        for room_data in data.get("rooms", []):
            new_room = VRRoom(
                tenant_id=current_user.tenant_id,
                property_id=property_id,
                room_code=room_data.get("room_code"),
                room_type=room_data.get("room_type"),
                floor=room_data.get("floor"),
                bed_type=room_data.get("bed_type"),
                capacity=room_data.get("capacity"),
                size_sqm=room_data.get("size_sqm"),
                price_per_night=room_data.get("price_per_night"),
                vr_link=room_data.get("vr_link"),
                booking_url=room_data.get("booking_url"),
                status=room_data.get("status", "available"),
                amenities_json=room_data.get("amenities"),
                attributes_json=room_data.get("attributes_json"),
                display_order=room_data.get("display_order", 0)
            )
            db.add(new_room)
            db.flush()
            
            # Import translations
            for locale, trans_data in room_data.get("translations", {}).items():
                translation = VRRoomTranslation(
                    room_id=new_room.id,
                    locale=locale,
                    name=trans_data.get("name"),
                    description=trans_data.get("description"),
                    amenities_text=trans_data.get("amenities_text")
                )
                db.add(translation)
            
            summary["rooms"] += 1
        
        # Import dining
        for dining_data in data.get("dining", []):
            new_dining = VRDining(
                tenant_id=current_user.tenant_id,
                property_id=property_id,
                code=dining_data.get("code", f"dining_{summary['dining']+1}"),
                dining_type=dining_data.get("dining_type"),
                cuisine_types=dining_data.get("cuisine_types"),
                capacity=dining_data.get("capacity"),
                operating_hours=dining_data.get("operating_hours"),
                vr_link=dining_data.get("vr_link"),
                booking_url=dining_data.get("booking_url"),
                status=dining_data.get("status", "active"),
                attributes_json=dining_data.get("attributes_json"),
                display_order=dining_data.get("display_order", 0)
            )
            db.add(new_dining)
            db.flush()
            
            for locale, trans_data in dining_data.get("translations", {}).items():
                translation = VRDiningTranslation(
                    dining_id=new_dining.id,
                    locale=locale,
                    name=trans_data.get("name"),
                    description=trans_data.get("description")
                )
                db.add(translation)
            
            summary["dining"] += 1
        
        # Import services
        for service_data in data.get("services", []):
            new_service = VRService(
                tenant_id=current_user.tenant_id,
                property_id=property_id,
                code=service_data.get("code", f"service_{summary['services']+1}"),
                service_type=service_data.get("service_type"),
                availability=service_data.get("availability"),
                price_info=service_data.get("price_info"),
                vr_link=service_data.get("vr_link"),
                booking_url=service_data.get("booking_url"),
                status=service_data.get("status", "active"),
                attributes_json=service_data.get("attributes_json"),
                display_order=service_data.get("display_order", 0)
            )
            db.add(new_service)
            db.flush()
            
            for locale, trans_data in service_data.get("translations", {}).items():
                translation = VRServiceTranslation(
                    service_id=new_service.id,
                    locale=locale,
                    name=trans_data.get("name"),
                    description=trans_data.get("description")
                )
                db.add(translation)
            
            summary["services"] += 1
        
        # Import facilities
        for facility_data in data.get("facilities", []):
            new_facility = VRFacility(
                tenant_id=current_user.tenant_id,
                property_id=property_id,
                code=facility_data.get("code", f"facility_{summary['facilities']+1}"),
                facility_type=facility_data.get("facility_type"),
                operating_hours=facility_data.get("operating_hours"),
                vr_link=facility_data.get("vr_link"),
                status=facility_data.get("status", "active"),
                attributes_json=facility_data.get("attributes_json"),
                display_order=facility_data.get("display_order", 0)
            )
            db.add(new_facility)
            db.flush()
            
            for locale, trans_data in facility_data.get("translations", {}).items():
                translation = VRFacilityTranslation(
                    facility_id=new_facility.id,
                    locale=locale,
                    name=trans_data.get("name"),
                    description=trans_data.get("description")
                )
                db.add(translation)
            
            summary["facilities"] += 1
        
        db.commit()
        
        return {
            "status": "success",
            "message": "Property template imported successfully",
            "summary": summary,
            "next_steps": [
                "Update booking URLs for rooms, dining, and services",
                "Review and adjust prices if needed",
                "Upload property-specific images"
            ]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")
