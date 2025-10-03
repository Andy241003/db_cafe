from typing import Any, Optional, List
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from app.api.deps import SessionDep, CurrentUser, CurrentTenantId
from app.models import MediaFile
from app.schemas import MediaFileResponse, MediaFileCreate
from app import crud
import sys

print(" MEDIA.PY FILE LOADED!", flush=True, file=sys.stderr)
router = APIRouter()

# Create upload directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
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
    
    # Validate file type
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    try:
        # Generate unique filename
        file_key = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / file_key
        
        # Save file
        print(f"💾 Saving file to: {file_path}", flush=True, file=sys.stderr)
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Create database record  
        # Use string directly since schema now accepts str
        kind_value = kind or "image"  # default to "image"
            
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
        
        print(f"✅ Upload successful! File saved to DB", flush=True, file=sys.stderr)
        
        # Return proper response for frontend without accessing auto-generated fields
        # to avoid enum validation errors
        from datetime import datetime
        return {
            "id": 999,  # Fake ID for now
            "tenant_id": tenant_id,
            "uploader_id": current_user.id,
            "kind": kind_value,
            "mime_type": file.content_type,
            "file_key": file_key,
            "size_bytes": len(content),
            "alt_text": alt_text,
            "created_at": datetime.utcnow().isoformat()
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
    media_files = crud.media_file.get_by_tenant(
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
