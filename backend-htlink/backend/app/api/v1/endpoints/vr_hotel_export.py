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
        "rooms": [],
        "dining": [],
        "services": [],
        "facilities": []
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
        
        summary = {"locales": 0, "rooms": 0, "dining": 0, "services": 0, "facilities": 0}
        
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
