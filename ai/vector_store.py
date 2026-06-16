import os
from typing import List, Dict, Any, Optional
import uuid
import psycopg2
from psycopg2.extras import Json
import numpy as np

class VectorStore:
    """Vector store using PostgreSQL with pgvector extension."""
    
    def __init__(self):
        self.connection_string = os.getenv("DATABASE_URL")
        if not self.connection_string:
            raise ValueError("DATABASE_URL environment variable is not set")
        self.dimension = 1536  # From spec: embedding_dim=1536
        self._ensure_extension_and_table()
    
    def _get_connection(self):
        """Get a database connection."""
        return psycopg2.connect(self.connection_string)
    
    def _ensure_extension_and_table(self):
        """Ensure pgvector extension and required table exist."""
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Enable pgvector extension
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                
                # Create documents table if it doesn't exist
                cur.execute(f"""
                    CREATE TABLE IF NOT EXISTS document_chunks (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        embedding vector({self.dimension}),
                        metadata JSONB NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                
                # Create index for cosine similarity search
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_cosine 
                    ON document_chunks USING ivfflat (embedding vector_cosine_ops);
                """)
                conn.commit()
    
    def upsert(self, id: Optional[str], vector: List[float], metadata: Dict[str, Any]) -> str:
        """
        Insert or update a vector with metadata.
        If id is None, generate a new UUID.
        Returns the document ID.
        """
        if len(vector) != self.dimension:
            raise ValueError(f"Vector dimension mismatch: expected {self.dimension}, got {len(vector)}")
        
        doc_id = id if id else str(uuid.uuid4())
        
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Convert vector to PostgreSQL vector format
                vector_array = np.array(vector, dtype=np.float32)
                vector_str = "[" + ",".join(str(x) for x in vector_array) + "]"
                
                # Upsert the document
                cur.execute("""
                    INSERT INTO document_chunks (id, embedding, metadata)
                    VALUES (%s, %s::vector, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        embedding = EXCLUDED.embedding,
                        metadata = EXCLUDED.metadata,
                        created_at = CURRENT_TIMESTAMP
                    RETURNING id;
                """, (doc_id, vector_str, Json(metadata)))
                
                result = cur.fetchone()
                conn.commit()
                return result[0] if result else doc_id
    
    def query(self, vector: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Query for similar vectors using cosine similarity.
        Returns list of matches with id, metadata, and similarity score.
        """
        if len(vector) != self.dimension:
            raise ValueError(f"Query vector dimension mismatch: expected {self.dimension}, got {len(vector)}")
        
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Convert vector to PostgreSQL vector format
                vector_array = np.array(vector, dtype=np.float32)
                vector_str = "[" + ",".join(str(x) for x in vector_array) + "]"
                
                # Query using cosine similarity (1 - cosine_distance)
                cur.execute("""
                    SELECT 
                        id,
                        metadata,
                        1 - (embedding <=> %s::vector) as similarity
                    FROM document_chunks
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                """, (vector_str, vector_str, top_k))
                
                results = cur.fetchall()
                
                matches = []
                for row in results:
                    matches.append({
                        "id": row[0],
                        "metadata": row[1],
                        "similarity": float(row[2])
                    })
                
                return matches