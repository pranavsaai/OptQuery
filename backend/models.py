from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from database import Base


class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, index=True)
    original_query = Column(Text, nullable=False)
    optimized_query = Column(Text, nullable=True)
    complexity_score = Column(Float, nullable=True)
    execution_time_ms = Column(Float, nullable=True)
    issues_found = Column(JSON, nullable=True)
    suggestions = Column(JSON, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    index_suggestions = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_favorite = Column(Boolean, default=False)


class SavedQuery(Base):
    __tablename__ = "saved_queries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    query = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())