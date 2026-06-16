import os
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from .embeddings import get_embedding
from .vector_store import VectorStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

def retrieve_context(query: str, top_k: int = 5, session_id: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieve relevant context for a query.
    """
    try:
        # Embed the query
        query_embedding = get_embedding([query])[0]
        
        # Query vector store
        vector_store = VectorStore()
        results = vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k,
            session_id=session_id,
            user_id=user_id
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Error retrieving context for query: {e}")
        return []

def build_prompt(query: str, context_chunks: List[Dict[str, Any]]) -> str:
    """
    Build a prompt for Gemini with retrieved context.
    """
    if not context_chunks:
        return f"Question: {query}\n\nAnswer based on your general knowledge:"
    
    # Format context with sources
    context_text = "Relevant context from uploaded Excel files:\n\n"
    for i, chunk in enumerate(context_chunks):
        metadata = chunk.get("metadata", {})
        filename = metadata.get("filename", "Unknown")
        sheet_name = metadata.get("sheet_name", "Unknown")
        chunk_idx = metadata.get("chunk_index", 0)
        total_chunks = metadata.get("total_chunks", 1)
        
        context_text += f"[Source {i+1}: {filename} - Sheet: {sheet_name} (Chunk {chunk_idx+1}/{total_chunks})]\n"
        context_text += f"{chunk.get('text', '')}\n\n"
    
    prompt = f"""{context_text}
Based on the context above, answer the following question. If the context doesn't contain relevant information, say so clearly.

Question: {query}

Provide a concise and accurate answer. Include citations to the sources you used in your answer, referencing the filename and sheet name.
"""
    
    return prompt

def generate_answer(prompt: str) -> str:
    """
    Generate answer using Gemini 2.0 Flash.
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error generating answer with Gemini: {e}")
        return f"Error generating answer: {str(e)}"

def format_sources(context_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format source information for response.
    """
    sources = []
    seen = set()
    
    for chunk in context_chunks:
        metadata = chunk.get("metadata", {})
        source_key = f"{metadata.get('filename', '')}_{metadata.get('sheet_name', '')}"
        
        if source_key not in seen:
            sources.append({
                "filename": metadata.get("filename", "Unknown"),
                "sheet_name": metadata.get("sheet_name", "Unknown"),
                "chunk_index": metadata.get("chunk_index", 0),
                "total_chunks": metadata.get("total_chunks", 1),
                "similarity_score": chunk.get("similarity_score", 0.0)
            })
            seen.add(source_key)
    
    return sources

def answer_query(query: str, session_id: Optional[str] = None, user_id: Optional[str] = None, top_k: int = 5) -> Dict[str, Any]:
    """
    Main RAG pipeline: retrieve context -> build prompt -> generate answer.
    """
    try:
        logger.info(f"Processing query: {query}")
        
        # Retrieve relevant context
        context_chunks = retrieve_context(query, top_k=top_k, session_id=session_id, user_id=user_id)
        logger.info(f"Retrieved {len(context_chunks)} context chunks")
        
        # Build prompt
        prompt = build_prompt(query, context_chunks)
        
        # Generate answer
        answer = generate_answer(prompt)
        
        # Format sources
        sources = format_sources(context_chunks)
        
        return {
            "success": True,
            "query": query,
            "answer": answer,
            "sources": sources,
            "context_count": len(context_chunks),
            "session_id": session_id
        }
        
    except Exception as e:
        logger.error(f"Error in RAG pipeline: {e}")
        return {
            "success": False,
            "query": query,
            "answer": f"Error processing query: {str(e)}",
            "sources": [],
            "error": str(e)
        }