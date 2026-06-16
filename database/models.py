import os
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    create_engine,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker, Session as DBSession

# Use pgvector if available, otherwise use ARRAY(Float) as fallback
try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    # Fallback for development without pgvector installed
    from sqlalchemy import ARRAY, Float

    class Vector:
        def __init__(self, dimension=None):
            self.dimension = dimension

        def __call__(self, *args, **kwargs):
            return ARRAY(Float)

# Environment variable for database URL
DATABASE_URL_ENV = "DATABASE_URL"
DATABASE_URL = os.environ.get(DATABASE_URL_ENV, "postgresql://postgres:postgres@localhost:5432/rag_app")

Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")
    uploaded_files = relationship("UploadedFile", back_populates="session", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_sessions_user_id", "user_id"),
        Index("ix_sessions_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<Session(id={self.id}, name={self.name}, user_id={self.user_id})>"


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(512), nullable=False)
    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    session = relationship("Session", back_populates="uploaded_files")
    document_chunks = relationship("DocumentChunk", back_populates="uploaded_file", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_uploaded_files_session_id", "session_id"),
        Index("ix_uploaded_files_uploaded_at", "uploaded_at"),
    )

    def __repr__(self):
        return f"<UploadedFile(id={self.id}, filename={self.filename}, session_id={self.session_id})>"


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    uploaded_file_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_files.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=False)  # OpenAI text-embedding-3-small dimension is 1536
    row_start = Column(Integer, nullable=False)
    row_end = Column(Integer, nullable=False)

    # Relationships
    uploaded_file = relationship("UploadedFile", back_populates="document_chunks")

    # Indexes for performance
    __table_args__ = (
        Index("ix_document_chunks_uploaded_file_id", "uploaded_file_id"),
        Index("ix_document_chunks_chunk_index", "chunk_index"),
        Index("ix_document_chunks_row_start", "row_start"),
        Index("ix_document_chunks_row_end", "row_end"),
    )

    def __repr__(self):
        return f"<DocumentChunk(id={self.id}, chunk_index={self.chunk_index}, uploaded_file_id={self.uploaded_file_id})>"


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    source_citations = Column(JSON, nullable=True)  # Store list of dicts with filename and row range
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    session = relationship("Session", back_populates="messages")

    # Indexes
    __table_args__ = (
        Index("ix_messages_session_id", "session_id"),
        Index("ix_messages_created_at", "created_at"),
        Index("ix_messages_role", "role"),
    )

    def __repr__(self):
        return f"<Message(id={self.id}, role={self.role}, session_id={self.session_id})>"