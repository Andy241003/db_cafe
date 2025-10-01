from typing import Any, Optional, List
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from app.api.deps import SessionDep, CurrentUser, CurrentTenantId
from app.models import MediaKind, MediaFile
from app.schemas import MediaFileResponse, MediaFileCreate
from app import crud
import sys

print(" MEDIA.PY FILE LOADED!", flush=True, file=sys.stderr)
router = APIRouter()

# Create upload directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload", response_model=MediaFileResponse)
async def upload_media_file(
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
    tenant_id: CurrentTenantId,
    file: Optional[UploadFile] = File(None),
    kind: Optional[MediaKind] = None,
    alt_text: Optional[str] = None,
) -> Any:
    print(" UPLOAD REACHED!", flush=True, file=sys.stderr)
    print(f"User: {current_user.email}, Role: {current_user.role}", flush=True, file=sys.stderr)
    print(f"File: {file.filename if file else 'None'}, Kind: {kind}", flush=True, file=sys.stderr)
    
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
        media_data = MediaFileCreate(
            file_key=file_key,
            original_filename=file.filename,
            kind=kind or MediaKind.IMAGE,
            alt_text=alt_text,
            file_size=len(content),
            mime_type=file.content_type,
            tenant_id=tenant_id
        )
        
        print(f"📝 Creating DB record for tenant {tenant_id}", flush=True, file=sys.stderr)
        media_file = crud.media_file.create(session=session, obj_in=media_data)
        
        print(f"✅ Upload successful! ID: {media_file.id}", flush=True, file=sys.stderr)
        return media_file
        
    except Exception as e:
        print(f"❌ Upload error: {str(e)}", flush=True, file=sys.stderr)
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
    media_files = crud.media_file.get_by_tenant_multi(
        session=session, tenant_id=tenant_id, skip=skip, limit=limit
    )
    return media_files


@router.get("/{file_key}")
async def serve_media_file(file_key: str):
    """Serve uploaded media files"""
    file_path = UPLOAD_DIR / file_key
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path)
