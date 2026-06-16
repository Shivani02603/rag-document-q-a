import os
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy.orm import Session as DBSession

from database.models import UploadedFile, Session

class FileService:
    @staticmethod
    def validate_file_extension(filename: str) -> bool:
        """Validate that the file has an allowed extension."""
        allowed_extensions = {'.xlsx', '.xls'}
        file_extension = os.path.splitext(filename)[1].lower()
        return file_extension in allowed_extensions
    
    @staticmethod
    def get_allowed_extensions() -> List[str]:
        """Get list of allowed file extensions."""
        return ['.xlsx', '.xls']
    
    @staticmethod
    def create_uploaded_file(
        db: DBSession,
        session_id: UUID,
        filename: str
    ) -> UploadedFile:
        """Create a new uploaded file record."""
        # Verify session exists
        session = db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise ValueError(f"Session with ID {session_id} not found")
        
        uploaded_file = UploadedFile(
            id=uuid4(),
            session_id=session_id,
            filename=filename,
            uploaded_at=datetime.utcnow()
        )
        
        db.add(uploaded_file)
        db.commit()
        db.refresh(uploaded_file)
        return uploaded_file
    
    @staticmethod
    def get_uploaded_file_by_id(db: DBSession, file_id: UUID) -> Optional[UploadedFile]:
        """Get an uploaded file by its ID."""
        return db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    
    @staticmethod
    def get_session_files(db: DBSession, session_id: UUID) -> List[UploadedFile]:
        """Get all files uploaded to a session."""
        return db.query(UploadedFile).filter(UploadedFile.session_id == session_id).order_by(UploadedFile.uploaded_at.desc()).all()