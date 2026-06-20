from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from benchmark import benchmark_queries
import time

from database import get_db, engine, get_raw_connection
from models import Base, QueryHistory, SavedQuery
from analyzer import analyze_query, suggest_indexes, get_execution_plan
from optimizer import optimize_with_ai, explain_query_in_plain_english

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="QuerySense API",
    description="Intelligent SQL Query Analyzer and Optimizer powered by AI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Models ─────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    query: str
    use_ai: bool = True
    explain_plan: bool = False

class SaveQueryRequest(BaseModel):
    name: str
    query: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class FavoriteRequest(BaseModel):
    is_favorite: bool


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "QuerySense API is running!", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "QuerySense"}


# ── Analyze ────────────────────────────────────────────────────────────────────

@app.post("/api/analyze")
async def analyze(request: AnalyzeRequest, db: Session = Depends(get_db)):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    start_time = time.time()

    analysis = analyze_query(request.query)
    index_suggestions = suggest_indexes(request.query)

    ai_result = {}
    if request.use_ai:
        ai_result = optimize_with_ai(
            request.query,
            analysis.get("issues", []),
            analysis.get("suggestions", [])
        )

    plain_explanation = explain_query_in_plain_english(request.query)

    execution_time = round((time.time() - start_time) * 1000, 2)

    history_entry = QueryHistory(
        original_query=request.query,
        optimized_query=ai_result.get("optimized_query", ""),
        complexity_score=analysis.get("complexity_score", 0),
        execution_time_ms=execution_time,
        issues_found=analysis.get("issues", []),
        suggestions=analysis.get("suggestions", []),
        ai_explanation=ai_result.get("explanation", ""),
        index_suggestions=index_suggestions
    )
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)

    return {
        "id": history_entry.id,
        "original_query": request.query,
        "formatted_query": analysis.get("formatted_query", request.query),
        "query_type": analysis.get("query_type", "UNKNOWN"),
        "complexity_score": analysis.get("complexity_score", 0),
        "complexity_label": analysis.get("complexity_label", "Unknown"),
        "issue_count": analysis.get("issue_count", 0),
        "severity_breakdown": {
            "high": analysis.get("high_severity", 0),
            "medium": analysis.get("medium_severity", 0),
            "low": analysis.get("low_severity", 0)
        },
        "issues": analysis.get("issues", []),
        "suggestions": analysis.get("suggestions", []),
        "index_suggestions": index_suggestions,
        "ai_optimization": ai_result,
        "plain_explanation": plain_explanation,
        "analysis_time_ms": execution_time
    }


# ── History ────────────────────────────────────────────────────────────────────

@app.get("/api/history")
def get_history(limit: int = 20, db: Session = Depends(get_db)):
    history = db.query(QueryHistory)\
        .order_by(QueryHistory.created_at.desc())\
        .limit(limit)\
        .all()

    return [{
        "id": h.id,
        "original_query": h.original_query[:100] + "..." if len(h.original_query) > 100 else h.original_query,
        "complexity_score": h.complexity_score,
        "complexity_label": _get_label(h.complexity_score),
        "issue_count": len(h.issues_found) if h.issues_found else 0,
        "analysis_time_ms": h.execution_time_ms,
        "is_favorite": h.is_favorite,
        "created_at": h.created_at.isoformat() if h.created_at else None
    } for h in history]


@app.get("/api/history/{query_id}")
def get_history_detail(query_id: int, db: Session = Depends(get_db)):
    entry = db.query(QueryHistory).filter(QueryHistory.id == query_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Query not found")
    return {
        "id": entry.id,
        "original_query": entry.original_query,
        "optimized_query": entry.optimized_query,
        "complexity_score": entry.complexity_score,
        "issues": entry.issues_found,
        "suggestions": entry.suggestions,
        "ai_explanation": entry.ai_explanation,
        "index_suggestions": entry.index_suggestions,
        "is_favorite": entry.is_favorite,
        "created_at": entry.created_at.isoformat() if entry.created_at else None
    }


@app.patch("/api/history/{query_id}/favorite")
def toggle_favorite(query_id: int, request: FavoriteRequest, db: Session = Depends(get_db)):
    entry = db.query(QueryHistory).filter(QueryHistory.id == query_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Query not found")
    entry.is_favorite = request.is_favorite
    db.commit()
    return {"message": "Updated", "is_favorite": entry.is_favorite}


@app.delete("/api/history/{query_id}")
def delete_history(query_id: int, db: Session = Depends(get_db)):
    entry = db.query(QueryHistory).filter(QueryHistory.id == query_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Query not found")
    db.delete(entry)
    db.commit()
    return {"message": "Deleted successfully"}


# ── Saved Queries ──────────────────────────────────────────────────────────────

@app.post("/api/saved")
def save_query(request: SaveQueryRequest, db: Session = Depends(get_db)):
    saved = SavedQuery(
        name=request.name,
        query=request.query,
        description=request.description,
        tags=request.tags
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return {"message": "Query saved!", "id": saved.id}


@app.get("/api/saved")
def get_saved(db: Session = Depends(get_db)):
    saved = db.query(SavedQuery).order_by(SavedQuery.created_at.desc()).all()
    return [{
        "id": s.id,
        "name": s.name,
        "query": s.query,
        "description": s.description,
        "tags": s.tags,
        "created_at": s.created_at.isoformat() if s.created_at else None
    } for s in saved]


@app.delete("/api/saved/{saved_id}")
def delete_saved(saved_id: int, db: Session = Depends(get_db)):
    saved = db.query(SavedQuery).filter(SavedQuery.id == saved_id).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved query not found")
    db.delete(saved)
    db.commit()
    return {"message": "Deleted successfully"}


# ── Stats ──────────────────────────────────────────────────────────────────────

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(QueryHistory).count()
    favorites = db.query(QueryHistory).filter(QueryHistory.is_favorite == True).count()
    all_entries = db.query(QueryHistory).all()

    if all_entries:
        avg_complexity = sum(e.complexity_score or 0 for e in all_entries) / len(all_entries)
        avg_time = sum(e.execution_time_ms or 0 for e in all_entries) / len(all_entries)
        total_issues = sum(len(e.issues_found or []) for e in all_entries)
    else:
        avg_complexity = avg_time = total_issues = 0

    return {
        "total_queries_analyzed": total,
        "favorite_queries": favorites,
        "avg_complexity_score": round(avg_complexity, 1),
        "avg_analysis_time_ms": round(avg_time, 1),
        "total_issues_detected": total_issues
    }


# ── Samples ────────────────────────────────────────────────────────────────────

@app.get("/api/samples")
def get_samples():
    return [
        {
            "name": "Bad Query - SELECT *",
            "query": "SELECT * FROM orders WHERE status = 'pending'",
            "description": "Common anti-pattern with SELECT *"
        },
        {
            "name": "N+1 Problem",
            "query": "SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 1000)",
            "description": "Subquery causing N+1 issue"
        },
        {
            "name": "Missing Index",
            "query": "SELECT name, email FROM customers WHERE LOWER(email) LIKE '%gmail%' ORDER BY created_at",
            "description": "Function on column prevents index usage"
        },
        {
            "name": "Multiple JOINs",
            "query": """SELECT u.name, o.total, p.name, c.category, s.status
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN products p ON o.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN shipments s ON o.id = s.order_id
WHERE o.created_at > '2024-01-01'""",
            "description": "Heavy JOIN query"
        },
        {
            "name": "Optimized Query",
            "query": """SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed'
AND o.created_at >= '2024-01-01'
LIMIT 100""",
            "description": "Well-written query for comparison"
        }
    ]

# Benchmark
class BenchmarkRequest(BaseModel):
    original_query: str
    optimized_query: str

@app.post("/api/benchmark")
async def benchmark(request: BenchmarkRequest):
    if not request.original_query.strip():
        raise HTTPException(status_code=400, detail="Original query cannot be empty")
    if not request.optimized_query.strip():
        raise HTTPException(status_code=400, detail="Optimized query cannot be empty")

    result = benchmark_queries(
        request.original_query,
        request.optimized_query
    )

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return result

# Helper function

def _get_label(score):
    if not score:
        return "Unknown"
    if score <= 20:
        return "Simple"
    elif score <= 50:
        return "Moderate"
    elif score <= 75:
        return "Complex"
    return "Critical"