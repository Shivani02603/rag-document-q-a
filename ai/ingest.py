import os
import pandas as pd
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
import logging
from .embeddings import get_embedding
from .vector_store import VectorStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """
    Recursive chunking strategy for text.
    Splits text into chunks of approximately chunk_size characters with overlap.
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = start + chunk_size
        if end >= text_length:
            chunks.append(text[start:])
            break
        # Try to find a sentence boundary
        split_point = text.rfind('. ', start, end)
        if split_point == -1 or split_point < start + chunk_size // 2:
            split_point = text.rfind(' ', start, end)
        if split_point == -1 or split_point < start + chunk_size // 2:
            split_point = end
        
        chunk = text[start:split_point].strip()
        if chunk:
            chunks.append(chunk)
        
        start = split_point - chunk_overlap
        if start < 0:
            start = 0
    
    return chunks

def parse_excel_to_text(file_path: str) -> List[Dict[str, Any]]:
    """
    Parse Excel file using pandas.
    Returns a list of dictionaries with sheet data.
    """
    try:
        excel_data = pd.read_excel(file_path, sheet_name=None)
        documents = []
        
        for sheet_name, df in excel_data.items():
            # Convert dataframe to text representation
            text_content = f"Sheet: {sheet_name}\n"
            text_content += df.to_string(index=False)
            
            # Add metadata
            documents.append({
                "sheet_name": sheet_name,
                "content": text_content,
                "row_count": len(df),
                "column_count": len(df.columns),
                "columns": list(df.columns)
            })
        
        return documents
    except Exception as e:
        logger.error(f"Error parsing Excel file {file_path}: {e}")
        raise

def chunk_document(document: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Chunk a document using recursive strategy with size 1000 and overlap 200.
    """
    content = document.get("content", "")
    if not content:
        return []
    
    # Chunk the text content
    text_chunks = chunk_text(content, chunk_size=1000, chunk_overlap=200)
    
    chunks = []
    for i, chunk_text in enumerate(text_chunks):
        chunk_id = str(uuid.uuid4())
        chunk_metadata = {
            "chunk_id": chunk_id,
            "chunk_index": i,
            "total_chunks": len(text_chunks),
            "sheet_name": document.get("sheet_name", ""),
            "row_count": document.get("row_count", 0),
            "column_count": document.get("column_count", 0),
            "columns": document.get("columns", []),
            "source_type": "excel",
            "created_at": datetime.utcnow().isoformat()
        }
        
        chunks.append({
            "id": chunk_id,
            "text": chunk_text,
            "metadata": chunk_metadata
        })
    
    return chunks

def ingest_document(file_path: str, filename: str, session_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Main ingestion pipeline: parse -> chunk -> embed -> upsert.
    """
    try:
        logger.info(f"Starting ingestion for file: {filename}")
        
        # Parse Excel file
        documents = parse_excel_to_text(file_path)
        logger.info(f"Parsed {len(documents)} sheets from {filename}")
        
        all_chunks = []
        total_chunks = 0
        
        # Process each sheet
        for doc in documents:
            chunks = chunk_document(doc)
            all_chunks.extend(chunks)
            total_chunks += len(chunks)
        
        logger.info(f"Created {total_chunks} chunks from {filename}")
        
        if not all_chunks:
            raise ValueError(f"No content extracted from {filename}")
        
        # Get embeddings for all chunks
        texts = [chunk["text"] for chunk in all_chunks]
        embeddings = get_embedding(texts)
        
        if len(embeddings) != len(all_chunks):
            raise ValueError(f"Embedding count mismatch: {len(embeddings)} != {len(all_chunks)}")
        
        # Prepare records for vector store
        records = []
        for i, chunk in enumerate(all_chunks):
            record = {
                "id": chunk["id"],
                "embedding": embeddings[i],
                "text": chunk["text"],
                "metadata": {
                    **chunk["metadata"],
                    "filename": filename,
                    "session_id": session_id,
                    "user_id": user_id,
                    "file_path": file_path
                }
            }
            records.append(record)
        
        # Upsert to vector store
        vector_store = VectorStore()
        inserted_count = vector_store.upsert(records)
        
        logger.info(f"Successfully ingested {inserted_count} chunks from {filename}")
        
        return {
            "success": True,
            "filename": filename,
            "sheet_count": len(documents),
            "chunk_count": total_chunks,
            "inserted_count": inserted_count,
            "session_id": session_id
        }
        
    except Exception as e:
        logger.error(f"Error ingesting document {filename}: {e}")
        return {
            "success": False,
            "filename": filename,
            "error": str(e)
        }