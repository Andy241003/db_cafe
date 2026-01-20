from typing import Any, Optional, List
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from app.api.deps import SessionDep, CurrentUser, CurrentTenantId
from app.models import MediaFile
from app.models.activity_log import ActivityType
from app.schemas import MediaFileResponse, MediaFileCreate
from app import crud
from app.crud import media_file
from app.utils.decorators.track_activity import track_activity
import sys

print(" MEDIA.PY FILE LOADED!", flush=True, file=sys.stderr)
router = APIRouter()

# Create upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
@track_activity(ActivityType.UPLOAD_MEDIA, message_template="Media file '{file.filename}' uploaded by {current_user.email}")
async def upload_media_file(
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    file: Optional[UploadFile] = File(None),
    kind: Optional[str] = None,
    alt_text: Optional[str] = None,
    source: Optional[str] = "general",  # New: travel, vr_hotel, general
    entity_type: Optional[str] = None,  # New: post, room, service, facility, offer
    entity_id: Optional[int] = None,    # New: ID of related entity
    folder: Optional[str] = None,        # New: posts, rooms, services, facilities
) -> Any:
    print(" UPLOAD REACHED!", flush=True, file=sys.stderr)
    print(f"User: {current_user.email}, Role: {current_user.role}", flush=True, file=sys.stderr)
    print(f"File: {file.filename if file else 'None'}, Kind: {kind}", flush=True, file=sys.stderr)
    print(f"🎯 Source: {source}, Entity Type: {entity_type}, Entity ID: {entity_id}, Folder: {folder}", flush=True, file=sys.stderr)
    
    # Validate kind parameter
    valid_kinds = ["image", "video", "file", "icon"]
    if kind and kind not in valid_kinds:
        raise HTTPException(status_code=400, detail=f"Invalid kind. Must be one of: {', '.join(valid_kinds)}")
    
    # Check permissions
    allowed_roles = ["OWNER", "ADMIN", "EDITOR"]
    if current_user.role.upper() not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size (100MB limit)
    content = await file.read()
    max_size = 100 * 1024 * 1024  # 100MB in bytes
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is 100MB, got {len(content)/1024/1024:.1f}MB")
    
    # Validate file type and auto-detect kind
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.pdf', '.doc', '.docx', '.txt'}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Auto-detect kind from file type if not provided
    if not kind:
        if file_ext in {'.jpg', '.jpeg', '.png', '.gif', '.webp'}:
            kind = "image"
        elif file_ext in {'.mp4', '.mov', '.avi'}:
            kind = "video"
        else:
            kind = "file"  # Use "file" instead of "document"
    
    try:
        # Generate unique filename
        file_key = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / file_key
        
        # Save file (content already read for size validation)
        print(f"💾 Saving file to: {file_path}", flush=True, file=sys.stderr)
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Create database record  
        kind_value = kind
            
        media_data = MediaFileCreate(
            file_key=file_key,
            kind=kind_value,
            alt_text=alt_text,
            size_bytes=len(content),
            mime_type=file.content_type,
            tenant_id=tenant_id,
            uploader_id=current_user.id
        )
        
        print(f"📝 Creating DB record for tenant {tenant_id}", flush=True, file=sys.stderr)
        print(f"📝 Media data: {media_data}", flush=True, file=sys.stderr)
        
        # Create MediaFile directly without using CRUD to avoid enum issues
        media_file = MediaFile(
            tenant_id=tenant_id,
            uploader_id=current_user.id,
            kind=kind_value,
            mime_type=file.content_type,
            file_key=file_key,
            original_filename=file.filename,  # Save original filename from upload
            size_bytes=len(content),
            alt_text=alt_text,
            # Source tracking
            source=source or "general",
            entity_type=entity_type,
            entity_id=entity_id,
            folder=folder
        )
        session.add(media_file)
        session.commit()
        
        print(f"✅ Upload successful! File saved to DB with ID: {media_file.id}", flush=True, file=sys.stderr)

        # Refresh to get auto-generated fields
        session.refresh(media_file)

        # Generate full URL for the uploaded file using media ID
        # Use request to get the base URL dynamically
        base_url = str(request.base_url).rstrip('/')
        file_url = f"{base_url}/api/v1/media/{media_file.id}/download"

        # Return proper response for frontend
        from datetime import datetime
        return {
            "id": media_file.id,
            "tenant_id": tenant_id,
            "uploader_id": current_user.id,
            "kind": kind_value,
            "mime_type": file.content_type,
            "file_key": file_key,
            "url": file_url,  # Full URL with media ID for direct access
            "size_bytes": len(content),
            "alt_text": alt_text,
            "created_at": media_file.created_at.isoformat() if media_file.created_at else datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        import traceback
        print(f"❌ Upload error: {str(e)}", flush=True, file=sys.stderr)
        print(f"❌ Full traceback: {traceback.format_exc()}", flush=True, file=sys.stderr)
        # Clean up file if it was created
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/", response_model=List[MediaFileResponse], response_model_exclude_none=False)
def read_media_files(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    skip: int = 0,
    limit: int = 100,
    source: Optional[str] = None,  # Filter by source: travel, vr_hotel, general
    folder: Optional[str] = None,  # Filter by folder: posts, rooms, services, facilities
    entity_type: Optional[str] = None,  # Filter by entity type
) -> Any:
    """Get media files for current tenant with optional filtering"""
    from sqlmodel import select
    
    # Build query with filters
    query = select(MediaFile).where(MediaFile.tenant_id == tenant_id)
    
    if source:
        query = query.where(MediaFile.source == source)
    if folder:
        query = query.where(MediaFile.folder == folder)
    if entity_type:
        query = query.where(MediaFile.entity_type == entity_type)
    
    query = query.offset(skip).limit(limit)
    media_files = session.exec(query).all()
    
    # Debug: Log first file to check if original_filename is loaded
    if media_files:
        print(f"🔍 DEBUG First media file: id={media_files[0].id}, original_filename={media_files[0].original_filename}, file_key={media_files[0].file_key}, source={media_files[0].source}, folder={media_files[0].folder}")
    return media_files


@router.get("/{file_key}")
async def serve_media_file(file_key: str):
    """Serve uploaded media files with CORS headers"""
    file_path = UPLOAD_DIR / file_key
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    response = FileResponse(file_path)
    
    # Add CORS headers for image serving
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response


@router.get("/{media_id}/view")
async def view_media_file(
    media_id: int,
    session: SessionDep,
):
    """View/display media file by ID - Public endpoint for image display"""
    # Get media file from database (no auth required for viewing)
    media_file_obj = media_file.get(db=session, id=media_id)
    if not media_file_obj:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Check if physical file exists
    file_path = UPLOAD_DIR / media_file_obj.file_key
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical file not found")
    
    from fastapi.responses import FileResponse
    
    # Serve file with proper mime type for inline display
    response = FileResponse(
        file_path,
        media_type=media_file_obj.mime_type or 'application/octet-stream'
    )
    
    # Add CORS headers for image serving
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response


@router.get("/{media_id}/download")
async def download_media_file(
    media_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
):
    """Download media file by ID with proper headers"""
    # Get media file from database
    media_file_obj = media_file.get(db=session, id=media_id)
    if not media_file_obj:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Check tenant access
    if media_file_obj.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if physical file exists
    file_path = UPLOAD_DIR / media_file_obj.file_key
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical file not found")
    
    from fastapi.responses import FileResponse
    
    # Use original filename if available, otherwise generate from file_key
    if media_file_obj.original_filename:
        filename = media_file_obj.original_filename
    else:
        file_extension = Path(media_file_obj.file_key).suffix
        filename = f"download_{media_file_obj.id}{file_extension}"
    
    # For images, force download by using octet-stream
    # This prevents browser from trying to display the image inline
    if media_file_obj.mime_type and media_file_obj.mime_type.startswith('image/'):
        media_type = 'application/octet-stream'
    else:
        media_type = media_file_obj.mime_type or 'application/octet-stream'
    
    # Create response with download headers
    response = FileResponse(
        file_path,
        filename=filename,
        media_type=media_type
    )
    
    # Force download instead of inline display for all files
    response.headers["Content-Disposition"] = f"attachment; filename=\"{filename}\""
    
    # Add CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
    
    return response


@router.put("/{media_id}")
@track_activity(ActivityType.UPDATE_MEDIA, message_template="Media file updated by {current_user.email}")
async def update_media_file(
    media_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    original_filename: Optional[str] = None,
    alt_text: Optional[str] = None,
    kind: Optional[str] = None,
):
    """Update media file information"""
    # Check permissions
    allowed_roles = ["OWNER", "ADMIN", "EDITOR"]
    if current_user.role.upper() not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get media file
    media_file_obj = media_file.get(db=session, id=media_id)
    if not media_file_obj:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Check tenant access
    if media_file_obj.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate kind if provided
    if kind:
        valid_kinds = ["image", "video", "file", "icon"]
        if kind not in valid_kinds:
            raise HTTPException(status_code=400, detail=f"Invalid kind. Must be one of: {', '.join(valid_kinds)}")
    
    # Validate and fix filename if provided
    if original_filename is not None and original_filename.strip():
        new_filename = original_filename.strip()
        
        # Check if filename has extension
        valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.pdf', '.doc', '.docx', '.txt']
        has_extension = any(new_filename.lower().endswith(ext) for ext in valid_extensions)
        
        # If no extension, auto-append the original file's extension
        if not has_extension:
            # Get original extension from file_key
            original_ext = Path(media_file_obj.file_key).suffix
            if original_ext:
                new_filename = f"{new_filename}{original_ext}"
                print(f"📝 Auto-appending extension: {new_filename}", flush=True, file=sys.stderr)
            else:
                raise HTTPException(status_code=400, detail="Filename must have a valid extension (e.g., .png, .jpg, .pdf)")
    
    try:
        # Update fields
        if original_filename is not None and original_filename.strip():
            media_file_obj.original_filename = new_filename
        if alt_text is not None:
            media_file_obj.alt_text = alt_text
        if kind is not None:
            media_file_obj.kind = kind
        
        session.commit()
        session.refresh(media_file_obj)
        
        return {
            "id": media_file_obj.id,
            "tenant_id": media_file_obj.tenant_id,
            "uploader_id": media_file_obj.uploader_id,
            "kind": media_file_obj.kind,
            "mime_type": media_file_obj.mime_type,
            "file_key": media_file_obj.file_key,
            "original_filename": media_file_obj.original_filename,
            "size_bytes": media_file_obj.size_bytes,
            "alt_text": media_file_obj.alt_text,
            "created_at": media_file_obj.created_at.isoformat()
        }
        
    except Exception as e:
        print(f"❌ Update error: {str(e)}", flush=True, file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")


@router.delete("/{media_id}")
@track_activity(ActivityType.DELETE_MEDIA, message_template="Media file deleted by {current_user.email}")
async def delete_media_file(
    media_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
):
    """Delete media file"""
    # Check permissions
    allowed_roles = ["OWNER", "ADMIN", "EDITOR"]
    if current_user.role.upper() not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get media file
    media_file_obj = media_file.get(db=session, id=media_id)
    if not media_file_obj:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Check tenant access
    if media_file_obj.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Delete physical file
        file_path = UPLOAD_DIR / media_file_obj.file_key
        if file_path.exists():
            file_path.unlink()
        
        # Delete from database
        media_file.remove(db=session, id=media_id)
        
        return {"message": "Media file deleted successfully"}
        
    except Exception as e:
        print(f"❌ Delete error: {str(e)}", flush=True, file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
