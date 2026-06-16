import os
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DBSession

from database.config import get_db
from database.models import UploadedFile, Session

router = APIRouter(prefix="/api/upload", tags=["Upload"])

# Pydantic schemas
class UploadResponse(BaseModel):
    id: UUID
    session_id: UUID
    filename: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    session_id: UUID,
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db)
):
    """Upload an Excel file and associate it with a session."""
    # Verify session exists
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Validate file type
    allowed_extensions = {'.xlsx', '.xls'}
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Create uploaded file record
    uploaded_file = UploadedFile(
        id=uuid4(),
        session_id=session_id,
        filename=file.filename,
        uploaded_at=datetime.utcnow()
    )
    
    try:
        db.add(uploaded_file)
        db.commit()
        db.refresh(uploaded_file)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file metadata: {str(e)}"
        )
    
    # Note: In a real implementation, you would save the file to disk or cloud storage
    # and trigger the ingestion pipeline asynchronously
    
    return uploaded_file