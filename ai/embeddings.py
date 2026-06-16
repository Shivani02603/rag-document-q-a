import os
from typing import List
import numpy as np
from openai import OpenAI

class EmbeddingClient:
    """Client for embedding text using OpenAI's text-embedding-3-small model."""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        self.client = OpenAI(api_key=api_key)
        self.model = "text-embedding-3-small"
        self.dimension = 1536  # From spec: embedding_dim=1536
    
    def embed_text(self, text: str) -> List[float]:
        """Embed a single text string."""
        response = self.client.embeddings.create(
            model=self.model,
            input=text,
            encoding_format="float"
        )
        vector = response.data[0].embedding
        if len(vector) != self.dimension:
            raise ValueError(f"Embedding dimension mismatch: expected {self.dimension}, got {len(vector)}")
        return vector
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of text strings."""
        if not texts:
            return []
        
        response = self.client.embeddings.create(
            model=self.model,
            input=texts,
            encoding_format="float"
        )
        
        vectors = [item.embedding for item in response.data]
        for i, vector in enumerate(vectors):
            if len(vector) != self.dimension:
                raise ValueError(f"Embedding dimension mismatch at index {i}: expected {self.dimension}, got {len(vector)}")
        return vectors