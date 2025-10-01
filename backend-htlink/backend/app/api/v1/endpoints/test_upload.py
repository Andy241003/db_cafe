from fastapi import APIRouter, UploadFile, File, Request
from typing import Optional
import sys

router = APIRouter()

@router.post("/test")
def test_upload_endpoint(
    request: Request,
    file: Optional[UploadFile] = File(None),
    kind: Optional[str] = None
):
    """
    Test upload endpoint without any dependencies
    """
    print("🎉🎉🎉 TEST UPLOAD ENDPOINT REACHED - SUCCESS!", flush=True, file=sys.stderr)
    print(f"📁 File: {file.filename if file else 'None'}", flush=True, file=sys.stderr)
    print(f"🏷️ Kind: {kind}", flush=True, file=sys.stderr)
    print(f"📋 Headers: {dict(request.headers)}", flush=True, file=sys.stderr)
    
    return {
        "message": "Test upload endpoint working!", 
        "status": "success",
        "file": file.filename if file else None,
        "kind": kind
    }