from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from app import crud
from app.api.deps import SessionDep, TenantUser, get_tenant_from_header
from app.models import MediaFile, MediaKind
from app.schemas import MediaFileCreate, MediaFileResponse, MediaFileUpdate

router = APIRouter()


@router.get("/", response_model=List[MediaFileResponse])
def read_media_files(
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: int = Depends(get_tenant_from_header),
    kind: Optional[MediaKind] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve media files for tenant, optionally filtered by kind.
    """
    media_files = crud.media_file.get_by_tenant(
        session, 
        tenant_id=tenant_id,
        kind=kind,
        skip=skip, 
        limit=limit
    )
    return media_files


@router.post("/upload", response_model=MediaFileResponse)
async def upload_media_file(
    *,
    session: SessionDep,
    current_user: TenantUser,
    tenant_id: int = Depends(get_tenant_from_header),
    file: UploadFile = File(...),
    kind: MediaKind,
    alt_text: Optional[str] = None,
) -> Any:
    """
    Upload media file. Editors and above can upload files.
    """
    if current_user.role not in ["owner", "admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # TODO: Implement actual file upload to storage (S3, local, etc.)
    # For now, we'll just store the filename and metadata
    
    # Create media file record
    media_in = MediaFileCreate(
        tenant_id=tenant_id,
        uploader_id=current_user.id,
        kind=kind,
        mime_type=file.content_type,
        file_key=f"{tenant_id}/{file.filename}",
        size_bytes=file.size,
        alt_text=alt_text
    )
    
    media_file = crud.media_file.create(session, obj_in=media_in)
    return media_file


@router.get("/{media_id}", response_model=MediaFileResponse)
def read_media_file(
    media_id: int,
    session: SessionDep,
    current_user: TenantUser,
) -> Any:
    """
    Get media file by ID.
    """
    media_file = crud.media_file.get(session, id=media_id)
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Check if user has access to this media file's tenant
    if current_user.tenant_id != media_file.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return media_file


@router.put("/{media_id}", response_model=MediaFileResponse)
def update_media_file(
    *,
    session: SessionDep,
    current_user: TenantUser,
    media_id: int,
    media_in: MediaFileUpdate,
) -> Any:
    """
    Update media file metadata. Editors and above can update.
    """
    if current_user.role not in ["owner", "admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    media_file = crud.media_file.get(session, id=media_id)
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Check if user has access to this media file's tenant
    if current_user.tenant_id != media_file.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    media_file = crud.media_file.update(session, db_obj=media_file, obj_in=media_in)
    return media_file


@router.delete("/{media_id}")
def delete_media_file(
    *,
    session: SessionDep,
    current_user: TenantUser,
    media_id: int,
) -> Any:
    """
    Delete media file. Editors and above can delete.
    """
    if current_user.role not in ["owner", "admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    media_file = crud.media_file.get(session, id=media_id)
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Check if user has access to this media file's tenant
    if current_user.tenant_id != media_file.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # TODO: Also delete actual file from storage
    
    crud.media_file.remove(session, id=media_id)
    return {"detail": "Media file deleted"}


@router.get("/{media_id}/download")
def download_media_file(
    media_id: int,
    session: SessionDep,
    current_user: TenantUser,
) -> Any:
    """
    Download media file.
    """
    media_file = crud.media_file.get(session, id=media_id)
    if not media_file:
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Check if user has access to this media file's tenant  
    if current_user.tenant_id != media_file.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # TODO: Implement actual file serving from storage
    # For now, return file info
    return {"file_key": media_file.file_key, "mime_type": media_file.mime_type}