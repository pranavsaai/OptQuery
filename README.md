# OptQuery — AI-Powered SQL Query Analyzer & Optimizer

> Intelligent SQL performance analysis powered by Groq AI (LLaMA 3.1), deployed on AWS with Docker, Nginx, RDS, S3, and CloudFront.

**Live Demo:** https://d33hks1hf8pk1y.cloudfront.net

---

## What is OptQuery?

OptQuery is a production-grade, full-stack web application that analyzes SQL queries for performance issues, generates AI-powered optimizations, suggests indexes, and benchmarks original vs optimized queries in real-time on a live PostgreSQL database.

Built to solve a real engineering problem — poorly written SQL queries are one of the most common causes of application slowdowns in enterprise systems. OptQuery detects these issues instantly and provides actionable fixes.

---

## Features

- **10+ SQL Issue Detectors** — Identifies SELECT *, missing WHERE clauses, N+1 subqueries, leading wildcard LIKE patterns, excessive JOINs, functions on indexed columns, ORDER BY without LIMIT, NOT IN null traps, and more
- **AI-Powered Optimization** — Integrates Groq AI (LLaMA 3.1) to generate optimized SQL with clear explanations and key improvements
- **Live Query Benchmarking** — Runs original and optimized queries 3 times each on real PostgreSQL, measures actual execution time, and shows side-by-side performance comparison with bar charts
- **Index Suggestions** — Automatically generates CREATE INDEX SQL statements based on query patterns
- **Plain English Explanations** — Translates complex SQL into simple language anyone can understand
- **Query History** — Saves all analyzed queries with complexity scores, issue counts, and timestamps
- **Saved Queries Library** — Save and reload frequently used queries
- **Complexity Scoring** — Scores queries from 0-100 (Simple / Moderate / Complex / Critical)
- **iOS-style UI** — Clean, dark, glassmorphism design with smooth Framer Motion animations

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | Frontend framework and build tool |
| Tailwind CSS v3 | Utility-first styling |
| Framer Motion | Smooth iOS-style animations |
| Recharts | Performance comparison bar charts |
| Axios | HTTP client for API calls |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| Python 3.11 | Core backend language |
| FastAPI | High-performance REST API framework |
| SQLAlchemy | ORM for PostgreSQL interaction |
| SQLParse | SQL query parsing and formatting |
| Groq AI (LLaMA 3.1) | AI-powered query optimization |
| Uvicorn | ASGI server for FastAPI |
| Psycopg2 | PostgreSQL database adapter |

### Infrastructure & DevOps
| Technology | Purpose |
|---|---|
| AWS EC2 (t2.micro) | Backend server hosting |
| AWS RDS PostgreSQL | Managed production database |
| AWS S3 | Frontend static file hosting |
| AWS CloudFront | CDN for global content delivery + HTTPS |
| Docker + Docker Compose | Backend containerization |
| Nginx | Reverse proxy for EC2 backend |
| SSL/TLS (ACM) | HTTPS certificate via AWS Certificate Manager |
| AWS IAM | Access control and security policies |

---

## Architecture

```
User Browser
     │
     ▼
AWS CloudFront (CDN + HTTPS)
     │
     ├──► S3 Bucket (React Frontend)
     │
     └──► EC2 Instance (Ubuntu 24.04)
               │
               ▼
          Nginx (Reverse Proxy)
               │
               ▼
          Docker Container
               │
               ▼
          FastAPI Backend
               │
               ▼
          AWS RDS PostgreSQL
```

---

## How It Works

### 1. SQL Analysis Engine (`analyzer.py`)
The static analysis engine parses SQL queries using SQLParse and applies 10+ pattern matching rules to detect performance anti-patterns. Each issue is assigned a severity level (HIGH/MEDIUM/LOW) and a complexity score is calculated out of 100.

**Issues detected:**
- `SELECT_STAR` — Fetching unnecessary columns
- `MISSING_WHERE` — Full table scan risk
- `LIKE_LEADING_WILDCARD` — Index prevention
- `SUBQUERY_IN_WHERE` — N+1 query problem
- `EXCESSIVE_JOINS` — Join explosion
- `OR_IN_WHERE` — Index bypass
- `FUNCTION_ON_COLUMN` — Index prevention
- `DISTINCT_USAGE` — JOIN mask detection
- `ORDER_BY_WITHOUT_LIMIT` — Full sort risk
- `NOT_IN_NULL_TRAP` — NULL logical trap

### 2. AI Optimization Engine (`optimizer.py`)
Detected issues and suggestions are sent to Groq AI (LLaMA 3.1) via structured prompts. The AI returns an optimized query with explanation, key improvements, and estimated performance impact.

### 3. Benchmark Engine (`benchmark.py`)
Runs both original and optimized queries 3 times on the live RDS PostgreSQL database using `EXPLAIN ANALYZE`. Measures average, min, and max execution times and calculates the percentage improvement.

### 4. Index Suggestion Engine
Analyzes WHERE clauses, JOIN conditions, and ORDER BY columns to generate targeted `CREATE INDEX` SQL statements with impact ratings.

---

## AWS Deployment

### EC2 Setup
- Ubuntu Server 24.04 LTS on t2.micro (free tier)
- Docker and Docker Compose installed
- Nginx configured as reverse proxy
- FastAPI backend containerized and running on port 8000
- Security groups configured for ports 80, 443, 8000, 22

### RDS PostgreSQL
- PostgreSQL 16 on db.t3.micro (free tier)
- Deployed in ap-southeast-2 (Sydney)
- Public access enabled with VPC security group
- Automated backups enabled

### S3 + CloudFront
- React build deployed to S3 bucket (`optquery-frontend`)
- CloudFront distribution with HTTPS via AWS Certificate Manager
- Global CDN for fast content delivery
- Cache invalidation on every deployment

### Docker
```yaml
services:
  backend:
    build: ./backend
    container_name: optquery-backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    restart: always
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16
- Groq API key (free at console.groq.com)

### Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
```

Create `.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/optquery
GROQ_API_KEY=your_groq_api_key_here
```

Run:
```bash
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze` | Analyze and optimize a SQL query |
| POST | `/api/benchmark` | Benchmark original vs optimized query |
| GET | `/api/history` | Get query analysis history |
| GET | `/api/history/{id}` | Get specific history entry |
| PATCH | `/api/history/{id}/favorite` | Toggle favorite |
| DELETE | `/api/history/{id}` | Delete history entry |
| POST | `/api/saved` | Save a query |
| GET | `/api/saved` | Get all saved queries |
| DELETE | `/api/saved/{id}` | Delete saved query |
| GET | `/api/stats` | Get dashboard statistics |
| GET | `/api/samples` | Get sample queries |
| GET | `/health` | Health check |

---

## Project Structure

```
OptQuery/
├── backend/
│   ├── main.py          # FastAPI application and all API endpoints
│   ├── analyzer.py      # SQL static analysis engine (10+ detectors)
│   ├── optimizer.py     # Groq AI integration for query optimization
│   ├── benchmark.py     # PostgreSQL query benchmarking engine
│   ├── database.py      # SQLAlchemy database configuration
│   ├── models.py        # Database ORM models
│   ├── Dockerfile       # Docker container configuration
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main app with routing and state
│   │   ├── api.js            # Centralized API calls
│   │   └── components/
│   │       ├── Navbar.jsx         # iOS-style navigation
│   │       ├── QueryEditor.jsx    # SQL editor with samples
│   │       ├── AnalysisResult.jsx # Full analysis display
│   │       ├── Benchmark.jsx      # Performance comparison
│   │       ├── History.jsx        # Query history
│   │       └── Saved.jsx          # Saved queries library
│   └── package.json
├── docker-compose.yml   # Docker orchestration
└── README.md
```

---

## Oracle Relevance

This project directly demonstrates skills aligned with Oracle's core engineering requirements:

- **Database engineering** — Deep understanding of SQL performance, query optimization, indexing strategies, and execution plans
- **Software design** — Clean layered architecture separating analysis, AI, benchmarking, and API layers
- **Debugging & troubleshooting** — Static analysis engine that diagnoses 10+ categories of database issues
- **Distributed systems** — Microservices architecture with containerized backend, managed database, and CDN-distributed frontend
- **Cloud infrastructure** — Full AWS deployment with EC2, RDS, S3, CloudFront, IAM, and security groups
- **AI integration** — Production LLM integration with structured prompting and response parsing
- **Performance engineering** — Real query benchmarking with 3-run averages, min/max analysis, and improvement percentages

---

## Author

**Kuchipudi Pranav Sai**
- GitHub: [github.com/pranavsaai](https://github.com/pranavsaai)
- LinkedIn: [linkedin.com/in/pranavsai](https://linkedin.com/in/pranavsai)
- Email: pkuchipu2@gitam.in
