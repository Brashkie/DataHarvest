# DataHarvest Pro v2.0

<div align="center">

![DataHarvest Logo](frontend/public/dataharvest_logo.svg)

**Professional data scraping & analytics platform**

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-black?logo=flask)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis)](https://redis.io)
[![Celery](https://img.shields.io/badge/Celery-5.4-37814a?logo=celery)](https://docs.celeryq.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker)](https://docker.com)

</div>

---

## Overview

DataHarvest is a full-stack data platform for scraping, processing, analyzing, and exporting data from any website. It features a modern React frontend with real-time WebSocket updates, a Flask + Celery backend for background task processing, and support for multiple scraping engines.

## Features

- **Multi-engine scraping** — Playwright, Selenium, Requests, CloudScraper with auto-selection
- **Real-time progress** — WebSocket updates via Socket.IO while jobs run
- **Smart URL Tester** — detects Cloudflare, JS-heavy sites, HTTP errors before creating jobs
- **Data storage** — Parquet (Snappy compression) + PostgreSQL + Redis
- **Guided onboarding** — spotlight tour for new users, per-module guides
- **Analytics** — EDA profiles, DuckDB SQL, Polars for high-performance processing
- **AI/ML Studio** — XGBoost, scikit-learn, TensorFlow model training
- **Pipelines** — Visual ETL editor with ReactFlow
- **Exports** — CSV, Excel, JSON, Parquet
- **Docker ready** — full docker-compose with all services

## Stack

### Frontend
| Tech | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| TanStack Start | 1.x | SSR framework |
| TanStack Router | latest | File-based routing |
| TanStack Query | latest | Server state management |
| Tailwind CSS | v4 | Styling |
| Zustand | latest | Client state |
| Recharts | latest | Data visualization |
| Socket.IO Client | latest | Real-time updates |
| Lucide React | latest | Icons |

### Backend
| Tech | Version | Purpose |
|------|---------|---------|
| Flask | 3.0.3 | API framework |
| Celery | 5.4 | Task queue |
| SQLAlchemy | latest | ORM |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Broker + cache |
| Polars | latest | Fast DataFrame |
| PyArrow | latest | Parquet storage |
| Playwright | latest | Browser automation |
| Selenium | latest | Browser automation |
| CloudScraper | latest | Cloudflare bypass |
| BeautifulSoup4 | latest | HTML parsing |
| DuckDB | latest | In-process SQL |
| XGBoost | latest | ML models |
| TensorFlow | 2.17 | Deep learning |
| Prophet | 1.1.5 | Time series |

## Project Structure

```
DataHarvest/
├── frontend/                  # React + TanStack Start
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # AppShell, Sidebar, TopBar
│   │   │   ├── onboarding/    # TourManager, TourSpotlight, TourTooltip
│   │   │   └── ui/            # Shared UI components
│   │   ├── hooks/             # useApi, React Query hooks
│   │   ├── lib/               # Axios instance, Socket.IO
│   │   ├── pages/             # Dashboard, Scraper, Analytics, etc.
│   │   ├── routes/            # TanStack Router routes
│   │   └── stores/            # Zustand stores
│   ├── public/
│   │   └── dataharvest_logo.svg
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                   # Flask + Celery
│   ├── app/
│   │   ├── api/               # REST blueprints
│   │   │   ├── scraper.py
│   │   │   ├── tables.py
│   │   │   ├── analytics.py
│   │   │   └── ...
│   │   ├── core/              # DB models, Celery config
│   │   │   ├── database.py
│   │   │   ├── celery_app.py
│   │   │   └── socket_events.py
│   │   ├── scrapers/
│   │   │   └── engines/
│   │   │       └── scraper_engine.py  # Playwright, Selenium, Requests, CloudScraper
│   │   ├── tasks/             # Celery tasks
│   │   │   ├── scraper_tasks.py
│   │   │   ├── analytics_tasks.py
│   │   │   ├── ai_tasks.py
│   │   │   └── ...
│   │   └── utils/             # Cython extensions (.pyx)
│   ├── data/
│   │   ├── scraped/           # Parquet results
│   │   └── uploads/           # Uploaded datasets
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.py
│
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (via WSL on Windows)
- Docker (optional)

### Development Setup

**1. Clone the repo:**
```bash
git clone https://github.com/Brashkie/DataHarvest.git
cd DataHarvest
```

**2. Backend setup:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
playwright install chromium
```

**3. Configure environment:**
```bash
cp backend/.env.example backend/.env
# Edit DATABASE_URL, REDIS_URL, etc.
```

**4. Frontend setup:**
```bash
cd frontend
npm install
```

**5. Start Redis (WSL on Windows):**
```bash
sudo service redis-server start
```

**6. Run all services (3 terminals):**

```bash
# Terminal 1 — Backend
cd backend && venv\Scripts\activate && py run.py

# Terminal 2 — Celery Worker
cd backend && venv\Scripts\activate
celery -A run.celery worker -Q scraping,pipelines,analytics,ai,exports -c 1 --loglevel=info --pool=solo

# Terminal 3 — Frontend
cd frontend && npm run dev
```

**7. Open:** http://localhost:3000

### Docker Setup

```bash
docker-compose up --build
```

Open: http://localhost:80

## Database Models

| Table | Purpose |
|-------|---------|
| `scraper_jobs` | Scraping job records with status, config, results |
| `scraper_profiles` | Reusable scraper configurations |
| `pipelines` | ETL pipeline definitions (ReactFlow) |
| `pipeline_runs` | Pipeline execution history |
| `datasets` | Dataset metadata (Parquet files) |
| `ml_models` | Trained model registry |
| `job_logs` | Real-time logs per job |
| `export_jobs` | Export task records |

## Scraping Engines

| Engine | Best for |
|--------|---------|
| `auto` | Automatic selection based on URL analysis |
| `playwright` | JS-heavy sites, SPAs, React/Vue apps |
| `selenium` | Complex interactions, form filling |
| `requests` | Fast static HTML pages |
| `cloudscraper` | Cloudflare-protected sites |

## API Endpoints

```
GET    /api/v1/health/
GET    /api/v1/scraper/jobs
POST   /api/v1/scraper/jobs
GET    /api/v1/scraper/jobs/:id
DELETE /api/v1/scraper/jobs/:id
GET    /api/v1/scraper/jobs/:id/results
POST   /api/v1/scraper/test-url
GET    /api/v1/tables/datasets
POST   /api/v1/tables/datasets/upload
GET    /api/v1/tables/datasets/:id
GET    /api/v1/tables/datasets/:id/export/:fmt
GET    /api/v1/analytics/...
GET    /api/v1/monitor/...
```

Full API docs: http://localhost:5000/api/docs/

## Environment Variables

```env
# App
APP_ENV=development
APP_SECRET_KEY=your-secret-key
APP_PORT=5000

# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/dataharvest
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Scraping
PLAYWRIGHT_HEADLESS=true
REQUEST_TIMEOUT=30

# AI/ML (optional)
OPENAI_API_KEY=
HUGGINGFACE_TOKEN=
```

## License

MIT — Built by [Brashkie / Hepein Oficial](https://github.com/Brashkie)
