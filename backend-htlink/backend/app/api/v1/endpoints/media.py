from typing import Any, Optional, List
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from app.api.deps import SessionDep, CurrentUser
from app.models import MediaFile
from app.models.activity_log import ActivityType
from app.schemas import MediaFileResponse, MediaFileCreate
from app.crud import media_file
from app.utils.decorators.track_activity import track_activity

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
@track_activity(ActivityType.UPLOAD_MEDIA, message_template="Media file '{file.filename}' uploaded by {current_user.email}")
async def upload_media_file(
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
    file: Optional[UploadFile] = File(None),
    kind: Optional[str] = None,
    alt_text: Optional[str] = None,
    source: Optional[str] = "general",
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    folder: Optional[str] = None,
) -> Any:
    print(f"📝 [MEDIA.UPLOAD] Starting upload - file: {file.filename if file else 'None'}, kind: {kind}")

    valid_kinds = ["image", "video", "file", "icon"]
    if kind and kind not in valid_kinds:
        raise HTTPException(status_code=400, detail=f"Invalid kind. Must be one of: {', '.join(valid_kinds)}")

    allowed_roles = ["OWNER", "ADMIN", "EDITOR"]
    if current_user.role.upper() not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()
    print(f"📝 [MEDIA.UPLOAD] File read - size: {len(content)} bytes")
    
    max_size = 100 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is 100MB, got {len(content)/1024/1024:.1f}MB")

    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.pdf', '.doc', '.docx', '.txt'}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")

    if not kind:
        if file_ext in {'.jpg', '.jpeg', '.png', '.gif', '.webp'}:
            kind = "image"
        elif file_ext in {'.mp4', '.mov', '.avi'}:
            kind = "video"
        else:
            kind = "file"

    effective_tenant_id = current_user.tenant_id or 1

    try:
        file_key = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / file_key
        print(f"📝 [MEDIA.UPLOAD] Saving file to disk - path: {file_path}")
        
        with open(file_path, "wb") as f:
            f.write(content)
        print(f"✅ [MEDIA.UPLOAD] File saved successfully")

        kind_value = kind
        media_data = MediaFileCreate(
            file_key=file_key,
            kind=kind_value,
            alt_text=alt_text,
            size_bytes=len(content),
            mime_type=file.content_type,
            tenant_id=effective_tenant_id,
            uploader_id=current_user.id,
        )

        media_obj = MediaFile(
            tenant_id=effective_tenant_id,
            uploader_id=current_user.id,
            kind=kind_value,
            mime_type=file.content_type,
            file_key=file_key,
            original_filename=file.filename,
            size_bytes=len(content),
            alt_text=alt_text,
            source=source or "general",
            entity_type=entity_type,
            entity_id=entity_id,
            folder=folder,
        )
        print(f"📝 [MEDIA.UPLOAD] Creating media record in database")
        
        session.add(media_obj)
        session.commit()
        session.refresh(media_obj)
        print(f"✅ [MEDIA.UPLOAD] Media record created - ID: {media_obj.id}")

        base_url = str(request.base_url).rstrip('/')
        file_url = f"{base_url}/api/v1/media/{media_obj.id}/download"

        from datetime import datetime
        result = {
            "id": media_obj.id,
            "tenant_id": effective_tenant_id,
            "uploader_id": current_user.id,
            "kind": kind_value,
            "mime_type": file.content_type,
            "file_key": file_key,
            "url": file_url,
            "size_bytes": len(content),
            "alt_text": alt_text,
            "created_at": media_obj.created_at.isoformat() if media_obj.created_at else datetime.utcnow().isoformat(),
        }
        print(f"✅ [MEDIA.UPLOAD] Upload completed successfully - returning response")
        return result
    except Exception as e:
        print(f"❌ [MEDIA.UPLOAD] Error occurred: {str(e)}", exc_info=True)
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/", response_model=List[MediaFileResponse], response_model_exclude_none=False)
def read_media_files(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    kind: Optional[str] = None,
    source: Optional[str] = None,
    folder: Optional[str] = None,
    entity_type: Optional[str] = None,
) -> Any:
    from sqlmodel import select

    effective_tenant_id = current_user.tenant_id or 1
    query = select(MediaFile).where(MediaFile.tenant_id == effective_tenant_id)

    if kind:
        query = query.where(MediaFile.kind == kind)
    if source:
        query = query.where(MediaFile.source == source)
    if folder:
        query = query.where(MediaFile.folder == folder)
    if entity_type:
        query = query.where(MediaFile.entity_type == entity_type)

    query = query.offset(skip).limit(limit)
    media_files = session.exec(query).all()
    return media_files


@router.get("/{file_key}")
async def serve_media_file(file_key: str):
    file_path = UPLOAD_DIR / file_key
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    from fastapi.responses import FileResponse
    response = FileResponse(file_path)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


@router.get("/{media_id}/view")
async def view_media_file(
    media_id: int,
    session: SessionDep,
):
    media_file_obj = media_file.get(db=session, id=media_id)
    if not media_file_obj:
        raise HTTPException(status_code=404, detail="Media file not found")

    file_path = UPLOAD_DIR / media_file_obj.file_key
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical file not found")

    from fastapi.responses import FileResponse
    response = FileResponse(file_path, media_type=media_file_obj.mime_type or 'application/octet-stream')
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


@router.get("/{media_id}/download")
async def download_media_file(
    media_id: int,
    session: SessionDep,
    current_user: CurrentUser,
):
    media_file_obj = media_file.get(db=session, id=media_id)
    if not media_file_obj:
        raise HTTPException(status_code=404, detail="Media file not found")

    effective_tenant_id = current_user.tenant_id or 1
    if media_file_obj.tenant_id != effective_tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = UPLOAD_DIR / media_file_obj.file_key
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical file not found")

    from fastapi.responses import FileResponse
    if media_file_obj.original_filename:
        filename = media_file_obj.original_filename
    else:
        file_extension = Path(media_file_obj.file_key).suffix
        filename = f"download_{media_file_obj.id}{file_extension}"

    media_type = 'application/octet-stream' if media_file_obj.mime_type and media_file_obj.mime_type.startswith('image/') else (media_file_obj.mime_type or 'application/octet-stream')
    response = FileResponse(file_path, filename=filename, media_type=media_type)
    response.headers["Content-Disposition"] = f"attachment; filename=\"{filename}\""
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
    original_filename: Optional[str] = None,
    alt_text: Optional[str] = None,
    kind: Optional[str] = None,
):
    allowed_roles = ["OWNER", "ADMIN", "EDITOR"]
    if current_user.role.upper() not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    media_file_obj = media_file.get(db=session, id=media_id)
    if not media_file_obj:
        raise HTTPException(status_code=404, detail="Media file not found")

    effective_tenant_id = current_user.tenant_id or 1
    if media_file_obj.tenant_id != effective_tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if kind:
        valid_kinds = ["image", "video", "file", "icon"]
        if kind not in valid_kinds:
            raise HTTPException(status_code=400, detail=f"Invalid kind. Must be one of: {', '.join(valid_kinds)}")

    if original_filename is not None and original_filename.strip():
        new_filename = original_filename.strip()
        valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.pdf', '.doc', '.docx', '.txt']
        has_extension = any(new_filename.lower().endswith(ext) for ext in valid_extensions)
        if not has_extension:
            original_ext = Path(media_file_obj.file_key).suffix
            if original_ext:
                new_filename = f"{new_filename}{original_ext}"
            else:
                raise HTTPException(status_code=400, detail="Filename must have a valid extension (e.g., .png, .jpg, .pdf)")

    try:
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
            "created_at": media_file_obj.created_at.isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")


@router.delete("/{media_id}")
@track_activity(ActivityType.DELETE_MEDIA, message_template="Media file deleted by {current_user.email}")
async def delete_media_file(
    media_id: int,
    session: SessionDep,
    current_user: CurrentUser,
):
    allowed_roles = ["OWNER", "ADMIN", "EDITOR"]
    if current_user.role.upper() not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    media_file_obj = media_file.get(db=session, id=media_id)
    if not media_file_obj:
        raise HTTPException(status_code=404, detail="Media file not found")

    effective_tenant_id = current_user.tenant_id or 1
    if media_file_obj.tenant_id != effective_tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        file_path = UPLOAD_DIR / media_file_obj.file_key
        if file_path.exists():
            file_path.unlink()

        media_file.remove(db=session, id=media_id)
        return {"message": "Media file deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

