import os
from groq import Groq
from dotenv import load_dotenv
from typing import Dict, Any
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


def optimize_with_ai(query: str, issues: list, suggestions: list) -> Dict[str, Any]:
    if not os.getenv("GROQ_API_KEY"):
        return {
            "optimized_query": query,
            "explanation": "Add GROQ_API_KEY to enable AI optimization",
            "key_improvements": [],
            "performance_impact": "Unknown"
        }

    issues_text = "\n".join([f"- [{i['severity']}] {i['message']}" for i in issues]) if issues else "No critical issues detected"
    suggestions_text = "\n".join([f"- {s}" for s in suggestions]) if suggestions else "None"

    prompt = f"""You are a senior Oracle/PostgreSQL database engineer with 15+ years of experience.

Analyze this SQL query and provide an optimized version:

ORIGINAL QUERY:
{query}

DETECTED ISSUES:
{issues_text}

SUGGESTED IMPROVEMENTS:
{suggestions_text}

Respond ONLY with a valid JSON object (no markdown, no backticks) in exactly this format:
{{
    "optimized_query": "the complete optimized SQL query here",
    "explanation": "clear explanation of what was wrong and what was changed in 2-3 sentences",
    "key_improvements": ["improvement 1", "improvement 2", "improvement 3"],
    "performance_impact": "estimated performance improvement description",
    "best_practices": ["best practice 1", "best practice 2"]
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=1000
        )

        content = response.choices[0].message.content.strip()

        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        result = json.loads(content)
        return result

    except Exception as e:
        return {
            "optimized_query": query,
            "explanation": f"AI optimization unavailable: {str(e)}",
            "key_improvements": suggestions[:3] if suggestions else [],
            "performance_impact": "Manual review recommended",
            "best_practices": []
        }


def explain_query_in_plain_english(query: str) -> str:
    if not os.getenv("GROQ_API_KEY"):
        return "Add GROQ_API_KEY to enable AI explanations"

    prompt = f"""Explain this SQL query in simple plain English in exactly 2-3 sentences.
No technical jargon. Explain what data it fetches and from where.

SQL: {query}

Respond with just the plain English explanation, nothing else."""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=200
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Could not generate explanation: {str(e)}"