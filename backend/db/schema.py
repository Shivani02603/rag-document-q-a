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

# Import vector extension if available
try:
    from pgvector.sqlalchemy import Vector
    VECTOR_AVAILABLE = True
except ImportError:
    # Fallback for development without pgvector
    from sqlalchemy import LargeBinary
    VECTOR_AVAILABLE = False

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
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

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="uploaded_files")
    document_chunks = relationship("DocumentChunk", back_populates="uploaded_file", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index("ix_uploaded_files_session_id", "session_id"),
        Index("ix_uploaded_files_uploaded_at", "uploaded_at"),
    )

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    uploaded_file_id = Column(UUID(as_uuid=True), ForeignKey("uploaded_files.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    
    # Use Vector if pgvector is available, otherwise use LargeBinary
    if VECTOR_AVAILABLE:
        embedding = Column(Vector(1536), nullable=True)  # OpenAI text-embedding-3-small has 1536 dimensions
    else:
        embedding = Column(LargeBinary, nullable=True)
    
    row_start = Column(Integer, nullable=False)
    row_end = Column(Integer, nullable=False)
    
    # Relationships
    uploaded_file = relationship("UploadedFile", back_populates="document_chunks")
    
    # Indexes
    __table_args__ = (
        Index("ix_document_chunks_uploaded_file_id", "uploaded_file_id"),
        Index("ix_document_chunks_chunk_index", "chunk_index"),
    )
    
    # Add vector index if pgvector is available
    if VECTOR_AVAILABLE:
        __table_args__ = __table_args__ + (
            Index("ix_document_chunks_embedding", embedding, postgresql_using="ivfflat"),
        )

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    source_citations = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="messages")
    
    # Indexes
    __table_args__ = (
        Index("ix_messages_session_id", "session_id"),
        Index("ix_messages_created_at", "created_at"),
    )