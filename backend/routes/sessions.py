from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DBSession

from database.config import get_db
from database.models import Session, Message

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

# Pydantic schemas
class SessionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    source_citations: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    session_data: SessionCreate,
    db: DBSession = Depends(get_db)
):
    """Create a new chat session."""
    # For now, create a dummy user_id since auth is not implemented
    dummy_user_id = uuid4()
    
    db_session = Session(
        id=uuid4(),
        user_id=dummy_user_id,
        name=session_data.name,
        created_at=datetime.utcnow()
    )
    
    try:
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}"
        )
    
    return db_session

@router.get("/", response_model=List[SessionResponse])
def list_sessions(
    db: DBSession = Depends(get_db)
):
    """List all chat sessions."""
    # For now, return all sessions since auth is not implemented
    # In a real app, you would filter by user_id
    sessions = db.query(Session).order_by(Session.created_at.desc()).all()
    return sessions

@router.get("/{session_id}/messages", response_model=List[MessageResponse])
def get_messages(
    session_id: UUID,
    db: DBSession = Depends(get_db)
):
    """Get all messages for a specific session."""
    # Verify session exists
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at.asc()).all()
    return messages