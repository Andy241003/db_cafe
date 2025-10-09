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
) -> Any:
    print(" UPLOAD REACHED!", flush=True, file=sys.stderr)
    print(f"User: {current_user.email}, Role: {current_user.role}", flush=True, file=sys.stderr)
    print(f"File: {file.filename if file else 'None'}, Kind: {kind}", flush=True, file=sys.stderr)
    
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
            size_bytes=len(content),
            alt_text=alt_text
        )
        session.add(media_file)
        session.commit()
        
        print(f"✅ Upload successful! File saved to DB with ID: {media_file.id}", flush=True, file=sys.stderr)

        # Refresh to get auto-generated fields
        session.refresh(media_file)

        # Generate full URL for the uploaded file
        # Use request to get the base URL dynamically
        base_url = str(request.base_url).rstrip('/')
        file_url = f"{base_url}/api/v1/media/{file_key}"

        # Return proper response for frontend
        from datetime import datetime
        return {
            "id": media_file.id,
            "tenant_id": tenant_id,
            "uploader_id": current_user.id,
            "kind": kind_value,
            "mime_type": file.content_type,
            "file_key": file_key,
            "url": file_url,  # Add full URL
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


@router.get("/", response_model=List[MediaFileResponse])
def read_media_files(
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get media files for current tenant"""
    media_files = media_file.get_by_tenant(
        db=session, tenant_id=tenant_id, skip=skip, limit=limit
    )
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
    
    # Get original filename from file_key or create a proper filename
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
    
    try:
        # Update fields
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
            "size_bytes": media_file_obj.size_bytes,
            "alt_text": media_file_obj.alt_text,
            "created_at": media_file_obj.created_at.isoformat(),
            "updated_at": media_file_obj.updated_at.isoformat() if media_file_obj.updated_at else None
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
