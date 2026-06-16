from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import desc

from database.models import Session, Message

class SessionService:
    @staticmethod
    def create_session(db: DBSession, name: str, user_id: Optional[UUID] = None) -> Session:
        """Create a new session."""
        if user_id is None:
            user_id = uuid4()  # Dummy user ID for now
        
        session = Session(
            id=uuid4(),
            user_id=user_id,
            name=name,
            created_at=datetime.utcnow()
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def get_all_sessions(db: DBSession, user_id: Optional[UUID] = None) -> List[Session]:
        """Get all sessions, optionally filtered by user."""
        query = db.query(Session)
        
        if user_id:
            query = query.filter(Session.user_id == user_id)
        
        return query.order_by(desc(Session.created_at)).all()
    
    @staticmethod
    def get_session_by_id(db: DBSession, session_id: UUID) -> Optional[Session]:
        """Get a session by its ID."""
        return db.query(Session).filter(Session.id == session_id).first()
    
    @staticmethod
    def get_session_messages(db: DBSession, session_id: UUID) -> List[Message]:
        """Get all messages for a session."""
        return db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at.asc()).all()
    
    @staticmethod
    def add_message(
        db: DBSession,
        session_id: UUID,
        role: str,
        content: str,
        source_citations: Optional[dict] = None
    ) -> Message:
        """Add a message to a session."""
        message = Message(
            id=uuid4(),
            session_id=session_id,
            role=role,
            content=content,
            source_citations=source_citations,
            created_at=datetime.utcnow()
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        return message