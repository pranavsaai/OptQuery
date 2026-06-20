import time
import re
from typing import Dict, Any
from database import get_raw_connection


# Main benchmark function
def benchmark_queries(original: str, optimized: str) -> Dict[str, Any]:
    try:
        conn = get_raw_connection()
        cursor = conn.cursor()

        # Run original query benchmark
        original_result = _run_benchmark(cursor, original)

        # Run optimized query benchmark
        optimized_result = _run_benchmark(cursor, optimized)

        cursor.close()
        conn.close()

        # Calculate improvement
        orig_time = original_result["avg_time_ms"]
        opt_time = optimized_result["avg_time_ms"]

        if orig_time > 0:
            improvement_pct = round(((orig_time - opt_time) / orig_time) * 100, 1)
        else:
            improvement_pct = 0

        winner = "optimized" if opt_time < orig_time else "original"

        return {
            "original": original_result,
            "optimized": optimized_result,
            "improvement_percentage": improvement_pct,
            "winner": winner,
            "time_saved_ms": round(orig_time - opt_time, 2),
            "verdict": _get_verdict(improvement_pct)
        }

    except Exception as e:
        return {"error": str(e)}


# Run single query benchmark (3 runs, take average)
def _run_benchmark(cursor, query: str) -> Dict[str, Any]:
    # Safety check — only allow SELECT queries for benchmarking
    clean = query.strip().upper()
    if not clean.startswith("SELECT"):
        return {
            "error": "Only SELECT queries can be benchmarked",
            "avg_time_ms": 0,
            "runs": []
        }

    times = []
    rows_returned = 0
    planning_time = 0
    execution_time = 0

    try:
        # Run EXPLAIN ANALYZE to get detailed timing
        explain_query = f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {query}"
        
        for i in range(3):  # Run 3 times for accuracy
            start = time.perf_counter()
            try:
                cursor.execute(explain_query)
                plan_data = cursor.fetchone()
                end = time.perf_counter()
                elapsed = round((end - start) * 1000, 2)
                times.append(elapsed)

                # Extract timing from plan
                if plan_data and plan_data[0]:
                    plan = plan_data[0][0] if isinstance(plan_data[0], list) else plan_data[0]
                    planning_time = plan.get("Planning Time", 0)
                    execution_time = plan.get("Execution Time", 0)
                    rows_returned = plan.get("Plan", {}).get("Actual Rows", 0)

            except Exception as e:
                # Query might fail on non-existent tables — use timing only
                end = time.perf_counter()
                elapsed = round((end - start) * 1000, 2)
                times.append(elapsed)

        avg_time = round(sum(times) / len(times), 2)
        min_time = min(times)
        max_time = max(times)

        return {
            "avg_time_ms": avg_time,
            "min_time_ms": min_time,
            "max_time_ms": max_time,
            "runs": times,
            "planning_time_ms": round(planning_time, 2),
            "execution_time_ms": round(execution_time, 2),
            "rows_returned": rows_returned,
            "error": None
        }

    except Exception as e:
        return {
            "avg_time_ms": 0,
            "min_time_ms": 0,
            "max_time_ms": 0,
            "runs": [],
            "planning_time_ms": 0,
            "execution_time_ms": 0,
            "rows_returned": 0,
            "error": str(e)
        }


# Get verdict based on improvement
def _get_verdict(improvement_pct: float) -> str:
    if improvement_pct >= 80:
        return "Massive improvement! The optimization made a huge difference."
    elif improvement_pct >= 50:
        return "Significant improvement! Optimized query is much faster."
    elif improvement_pct >= 20:
        return "Noticeable improvement! Worth switching to optimized query."
    elif improvement_pct >= 0:
        return "Slight improvement. Both queries perform similarly."
    else:
        return "Original query was faster. Review the optimization."