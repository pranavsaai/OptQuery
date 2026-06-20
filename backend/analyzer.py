import sqlparse
import re
from typing import Dict, List, Any


def analyze_query(query: str) -> Dict[str, Any]:
    parsed = sqlparse.parse(query.strip())
    if not parsed:
        return {"error": "Invalid SQL query"}

    stmt = parsed[0]
    query_upper = query.upper()
    issues = []
    suggestions = []
    complexity_score = 0
    query_type = stmt.get_type() or "UNKNOWN"

    # Check SELECT *
    if re.search(r'SELECT\s+\*', query_upper):
        issues.append({
            "type": "SELECT_STAR",
            "severity": "HIGH",
            "message": "Using SELECT * fetches all columns unnecessarily",
            "line": _find_line(query, "SELECT *")
        })
        suggestions.append("Replace SELECT * with specific column names to reduce data transfer")
        complexity_score += 20

    # Missing WHERE clause
    if query_type in ("SELECT", "UPDATE", "DELETE"):
        if "WHERE" not in query_upper:
            issues.append({
                "type": "MISSING_WHERE",
                "severity": "HIGH",
                "message": f"{query_type} without WHERE clause — full table scan likely",
                "line": 1
            })
            suggestions.append("Add a WHERE clause to avoid full table scans")
            complexity_score += 30

    # LIKE with leading wildcard
    if re.search(r"LIKE\s+'%[^']*'", query_upper):
        issues.append({
            "type": "LIKE_LEADING_WILDCARD",
            "severity": "HIGH",
            "message": "LIKE with leading wildcard prevents index usage",
            "line": _find_line(query, "LIKE")
        })
        suggestions.append("Avoid leading wildcards. Use full-text search instead")
        complexity_score += 25

    # Too many JOINs
    join_count = len(re.findall(r'\bJOIN\b', query_upper))
    if join_count > 3:
        issues.append({
            "type": "EXCESSIVE_JOINS",
            "severity": "MEDIUM",
            "message": f"Query has {join_count} JOINs — may cause performance issues",
            "line": _find_line(query, "JOIN")
        })
        suggestions.append(f"Consider breaking into subqueries or CTEs")
        complexity_score += join_count * 8

    # Subquery in WHERE
    if re.search(r'WHERE\s+\w+\s+IN\s*\(\s*SELECT', query_upper):
        issues.append({
            "type": "SUBQUERY_IN_WHERE",
            "severity": "HIGH",
            "message": "Subquery inside WHERE IN — potential N+1 problem",
            "line": _find_line(query, "IN (SELECT")
        })
        suggestions.append("Replace subquery with a JOIN or EXISTS clause")
        complexity_score += 35

    # OR in WHERE
    if re.search(r'WHERE.*\bOR\b', query_upper):
        issues.append({
            "type": "OR_IN_WHERE",
            "severity": "MEDIUM",
            "message": "OR in WHERE clause can prevent index usage",
            "line": _find_line(query, "OR")
        })
        suggestions.append("Consider UNION ALL instead of OR for better index use")
        complexity_score += 15

    # Function on column
    func_patterns = re.findall(r'\b(UPPER|LOWER|TRIM|YEAR|MONTH|DAY|TO_CHAR|DATE_TRUNC)\s*\(\s*\w+', query_upper)
    if func_patterns:
        issues.append({
            "type": "FUNCTION_ON_COLUMN",
            "severity": "MEDIUM",
            "message": f"Functions {func_patterns} on columns prevent index usage",
            "line": 1
        })
        suggestions.append("Avoid functions on indexed columns in WHERE clauses")
        complexity_score += 20

    # DISTINCT overuse
    if "DISTINCT" in query_upper:
        issues.append({
            "type": "DISTINCT_USAGE",
            "severity": "LOW",
            "message": "DISTINCT may indicate a JOIN producing duplicates",
            "line": _find_line(query, "DISTINCT")
        })
        suggestions.append("Check if DISTINCT is masking a JOIN issue")
        complexity_score += 10

    # ORDER BY without LIMIT
    if "ORDER BY" in query_upper and "LIMIT" not in query_upper:
        issues.append({
            "type": "ORDER_BY_WITHOUT_LIMIT",
            "severity": "MEDIUM",
            "message": "ORDER BY without LIMIT sorts entire result set",
            "line": _find_line(query, "ORDER BY")
        })
        suggestions.append("Add LIMIT when using ORDER BY")
        complexity_score += 15

    # NOT IN null trap
    if re.search(r'\bNOT IN\b', query_upper):
        issues.append({
            "type": "NOT_IN_NULL_TRAP",
            "severity": "MEDIUM",
            "message": "NOT IN behaves unexpectedly with NULL values",
            "line": _find_line(query, "NOT IN")
        })
        suggestions.append("Use NOT EXISTS instead of NOT IN")
        complexity_score += 15

    complexity_score += min(len(query) // 50, 20)
    complexity_score = min(complexity_score, 100)

    if complexity_score <= 20:
        complexity_label = "Simple"
    elif complexity_score <= 50:
        complexity_label = "Moderate"
    elif complexity_score <= 75:
        complexity_label = "Complex"
    else:
        complexity_label = "Critical"

    return {
        "query_type": query_type,
        "issues": issues,
        "suggestions": suggestions,
        "complexity_score": complexity_score,
        "complexity_label": complexity_label,
        "issue_count": len(issues),
        "high_severity": sum(1 for i in issues if i["severity"] == "HIGH"),
        "medium_severity": sum(1 for i in issues if i["severity"] == "MEDIUM"),
        "low_severity": sum(1 for i in issues if i["severity"] == "LOW"),
        "formatted_query": sqlparse.format(
            query,
            reindent=True,
            keyword_case='upper',
            indent_width=2
        )
    }


def suggest_indexes(query: str) -> List[Dict[str, str]]:
    query_upper = query.upper()
    indexes = []

    tables = re.findall(r'(?:FROM|JOIN)\s+(\w+)', query_upper)
    where_cols = re.findall(r'WHERE\s+(\w+)\s*[=<>!]', query_upper)
    where_cols += re.findall(r'AND\s+(\w+)\s*[=<>!]', query_upper)
    join_cols = re.findall(r'ON\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)', query_upper)
    order_cols = re.findall(r'ORDER BY\s+(\w+)', query_upper)

    for col in set(where_cols):
        if col not in ('AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE'):
            table = tables[0].lower() if tables else "your_table"
            indexes.append({
                "type": "WHERE_INDEX",
                "sql": f"CREATE INDEX idx_{table}_{col.lower()} ON {table} ({col.lower()});",
                "reason": f"Column '{col}' used in WHERE — index speeds up filtering",
                "impact": "HIGH"
            })

    for left_col, right_col in join_cols:
        table = tables[0].lower() if tables else "your_table"
        indexes.append({
            "type": "JOIN_INDEX",
            "sql": f"CREATE INDEX idx_{table}_join ON {table} ({left_col.lower()});",
            "reason": f"JOIN on '{left_col}' — index speeds up join operations",
            "impact": "HIGH"
        })

    for col in set(order_cols):
        table = tables[0].lower() if tables else "your_table"
        indexes.append({
            "type": "ORDER_INDEX",
            "sql": f"CREATE INDEX idx_{table}_{col.lower()}_order ON {table} ({col.lower()});",
            "reason": f"ORDER BY '{col}' — index eliminates sort operation",
            "impact": "MEDIUM"
        })

    return indexes[:5]


def get_execution_plan(query: str, db_conn) -> Dict[str, Any]:
    try:
        cursor = db_conn.cursor()
        cursor.execute(f"EXPLAIN (ANALYZE, COSTS, VERBOSE, FORMAT JSON) {query}")
        plan = cursor.fetchone()
        cursor.close()
        return {"plan": plan[0] if plan else None, "error": None}
    except Exception as e:
        return {"plan": None, "error": str(e)}


def _find_line(query: str, pattern: str) -> int:
    lines = query.upper().split('\n')
    for i, line in enumerate(lines, 1):
        if pattern.upper() in line:
            return i
    return 1