from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from .ingest import ingest_excel
from .rag import answer_question

router = APIRouter(prefix="/api/ai", tags=["AI"])

class IngestRequest(BaseModel):
    session_id: str = Field(..., description="ID of the chat session")
    user_id: str = Field(..., description="ID of the user")

class IngestResponse(BaseModel):
    message: str = Field(..., description="Status message")
    file_id: str = Field(..., description="ID of the uploaded file")
    chunk_count: int = Field(..., description="Number of chunks created")

class QueryRequest(BaseModel):
    session_id: str = Field(..., description="ID of the chat session")
    user_id: str = Field(..., description="ID of the user")
    question: str = Field(..., description="Natural language question")
    top_k: Optional[int] = Field(default=5, description="Number of chunks to retrieve")

class SourceCitation(BaseModel):
    file_name: str = Field(..., description="Name of the source file")
    sheet_name: str = Field(..., description="Name of the Excel sheet")
    row_start: int = Field(..., description="Starting row of the chunk")
    row_end: int = Field(..., description="Ending row of the chunk")
    content_preview: str = Field(..., description="Preview of the chunk content")

class QueryResponse(BaseModel):
    answer: str = Field(..., description="Generated answer")
    sources: List[SourceCitation] = Field(..., description="List of source citations")
    session_id: str = Field(..., description="ID of the chat session")

@router.post("/ingest", response_model=IngestResponse)
async def ingest(
    session_id: str,
    user_id: str,
    file: UploadFile = File(...)
):
    """
    Endpoint to ingest an Excel file.
    """
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")
    
    try:
        file_id = str(uuid.uuid4())
        chunk_count = await ingest_excel(
            file=file,
            file_id=file_id,
            file_name=file.filename,
            session_id=session_id,
            user_id=user_id
        )
        return IngestResponse(
            message="File ingested successfully",
            file_id=file_id,
            chunk_count=chunk_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.post("/query", response_model=QueryResponse)
async def query(
    request: QueryRequest
):
    """
    Endpoint to answer a natural language question about ingested data.
    """
    try:
        answer, sources = await answer_question(
            session_id=request.session_id,
            user_id=request.user_id,
            question=request.question,
            top_k=request.top_k
        )
        return QueryResponse(
            answer=answer,
            sources=sources,
            session_id=request.session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")