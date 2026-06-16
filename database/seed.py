import os
import sys
from datetime import datetime, timedelta
from uuid import uuid4

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import Base, User, Session, UploadedFile, DocumentChunk, Message, SessionLocal, engine

def seed_database():
    """Seed the database with realistic sample data."""
    db = SessionLocal()
    
    try:
        print("Starting database seeding...")
        
        # Clear existing data (in reverse order of dependencies)
        print("Clearing existing data...")
        db.query(Message).delete()
        db.query(DocumentChunk).delete()
        db.query(UploadedFile).delete()
        db.query(Session).delete()
        db.query(User).delete()
        db.commit()
        
        # Create sample users
        print("Creating users...")
        users = [
            User(
                id=uuid4(),
                email="alice.johnson@example.com",
                created_at=datetime.utcnow() - timedelta(days=30)
            ),
            User(
                id=uuid4(),
                email="bob.smith@example.com",
                created_at=datetime.utcnow() - timedelta(days=25)
            ),
            User(
                id=uuid4(),
                email="carol.williams@example.com",
                created_at=datetime.utcnow() - timedelta(days=15)
            )
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        
        # Create sample sessions
        print("Creating sessions...")
        sessions = [
            Session(
                id=uuid4(),
                user_id=users[0].id,
                name="Q4 Financial Analysis",
                created_at=datetime.utcnow() - timedelta(days=20)
            ),
            Session(
                id=uuid4(),
                user_id=users[0].id,
                name="Sales Data Exploration",
                created_at=datetime.utcnow() - timedelta(days=15)
            ),
            Session(
                id=uuid4(),
                user_id=users[1].id,
                name="Customer Feedback Review",
                created_at=datetime.utcnow() - timedelta(days=10)
            ),
            Session(
                id=uuid4(),
                user_id=users[2].id,
                name="Inventory Management",
                created_at=datetime.utcnow() - timedelta(days=5)
            )
        ]
        
        for session in sessions:
            db.add(session)
        db.commit()
        
        # Create sample uploaded files
        print("Creating uploaded files...")
        uploaded_files = [
            UploadedFile(
                id=uuid4(),
                session_id=sessions[0].id,
                filename="financial_report_q4_2024.xlsx",
                uploaded_at=datetime.utcnow() - timedelta(days=19)
            ),
            UploadedFile(
                id=uuid4(),
                session_id=sessions[0].id,
                filename="budget_forecast.xlsx",
                uploaded_at=datetime.utcnow() - timedelta(days=18)
            ),
            UploadedFile(
                id=uuid4(),
                session_id=sessions[1].id,
                filename="sales_data_jan_mar.xlsx",
                uploaded_at=datetime.utcnow() - timedelta(days=14)
            ),
            UploadedFile(
                id=uuid4(),
                session_id=sessions[2].id,
                filename="customer_surveys_2024.xlsx",
                uploaded_at=datetime.utcnow() - timedelta(days=9)
            )
        ]
        
        for uploaded_file in uploaded_files:
            db.add(uploaded_file)
        db.commit()
        
        # Create sample document chunks
        print("Creating document chunks...")
        document_chunks = []
        
        # Sample embeddings (1536 dimensions for text-embedding-3-small)
        # Using placeholder vectors for demonstration
        sample_embedding = [0.1] * 1536
        
        for i, uploaded_file in enumerate(uploaded_files):
            for chunk_idx in range(3):  # 3 chunks per file
                chunk_id = uuid4()
                document_chunks.append(
                    DocumentChunk(
                        id=chunk_id,
                        uploaded_file_id=uploaded_file.id,
                        chunk_index=chunk_idx,
                        content=f"This is sample content from {uploaded_file.filename}, chunk {chunk_idx}. It contains financial data about revenue and expenses for the quarter.",
                        embedding=sample_embedding,
                        row_start=chunk_idx * 50,
                        row_end=(chunk_idx + 1) * 50 - 1
                    )
                )
        
        for chunk in document_chunks:
            db.add(chunk)
        db.commit()
        
        # Create sample messages
        print("Creating messages...")
        messages = [
            Message(
                id=uuid4(),
                session_id=sessions[0].id,
                role="user",
                content="What was the total revenue in Q4?",
                source_citations=[
                    {
                        "filename": "financial_report_q4_2024.xlsx",
                        "row_start": 0,
                        "row_end": 49,
                        "chunk_id": str(document_chunks[0].id)
                    }
                ],
                created_at=datetime.utcnow() - timedelta(hours=3)
            ),
            Message(
                id=uuid4(),
                session_id=sessions[0].id,
                role="assistant",
                content="Based on the financial report, the total revenue in Q4 2024 was $2.5 million, representing a 15% increase from Q3.",
                source_citations=[
                    {
                        "filename": "financial_report_q4_2024.xlsx",
                        "row_start": 0,
                        "row_end": 49,
                        "chunk_id": str(document_chunks[0].id)
                    },
                    {
                        "filename": "financial_report_q4_2024.xlsx",
                        "row_start": 50,
                        "row_end": 99,
                        "chunk_id": str(document_chunks[1].id)
                    }
                ],
                created_at=datetime.utcnow() - timedelta(hours=2, minutes=55)
            ),
            Message(
                id=uuid4(),
                session_id=sessions[1].id,
                role="user",
                content="Which product had the highest sales in January?",
                source_citations=[
                    {
                        "filename": "sales_data_jan_mar.xlsx",
                        "row_start": 0,
                        "row_end": 49,
                        "chunk_id": str(document_chunks[6].id)
                    }
                ],
                created_at=datetime.utcnow() - timedelta(days=1, hours=5)
            ),
            Message(
                id=uuid4(),
                session_id=sessions[1].id,
                role="assistant",
                content="Product XYZ had the highest sales in January with $450,000 in revenue, accounting for 32% of total monthly sales.",
                source_citations=[
                    {
                        "filename": "sales_data_jan_mar.xlsx",
                        "row_start": 0,
                        "row_end": 49,
                        "chunk_id": str(document_chunks[6].id)
                    },
                    {
                        "filename": "sales_data_jan_mar.xlsx",
                        "row_start": 50,
                        "row_end": 99,
                        "chunk_id": str(document_chunks[7].id)
                    }
                ],
                created_at=datetime.utcnow() - timedelta(days=1, hours=4, minutes=55)
            ),
            Message(
                id=uuid4(),
                session_id=sessions[2].id,
                role="user",
                content="What are the main themes in customer feedback?",
                source_citations=[
                    {
                        "filename": "customer_surveys_2024.xlsx",
                        "row_start": 0,
                        "row_end": 49,
                        "chunk_id": str(document_chunks[9].id)
                    }
                ],
                created_at=datetime.utcnow() - timedelta(hours=12)
            )
        ]
        
        for message in messages:
            db.add(message)
        db.commit()
        
        print("Database seeding completed successfully!")
        print(f"Created: {len(users)} users, {len(sessions)} sessions, {len(uploaded_files)} uploaded files,")
        print(f"         {len(document_chunks)} document chunks, {len(messages)} messages")
        
    except Exception as e:
        db.rollback()
        print(f"Error during database seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()