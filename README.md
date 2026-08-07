# DataHarvest Pro v3.0

<div align="center">

![DataHarvest Logo](public/dataharvest_logo.svg)

**Professional data scraping & analytics platform — high-performance, multi-engine, production-ready**

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-black?logo=flask)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis)](https://redis.io)
[![Celery](https://img.shields.io/badge/Celery-5.5-37814a?logo=celery)](https://docs.celeryq.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#features) · [Stack](#stack) · [Quick Start](#quick-start) · [Architecture](#architecture) · [Performance](#performance) · [API](#api-reference) · [Contributing](#contributing)

</div>

---

## Overview

DataHarvest is a full-stack data platform for **scraping, processing, analyzing, and exporting** data from any website at scale. It combines a React 19 frontend with real-time WebSocket updates, a Flask + Celery distributed backend, and native performance extensions written in **Cython, C/C++, Rust, and Zig** for the most demanding operations.

The platform is designed to handle everything from one-off scrapes to continuous ETL pipelines, ML model training, and multi-terabyte data exports — all from a single, unified UI.

---

## Features

| Category | Capabilities |
|----------|-------------|
| **Scraping** | Playwright, Selenium, Requests, CloudScraper, Scrapy — auto-selected by engine detection |
| **Real-time** | WebSocket progress streaming via Socket.IO — per-step live updates |
| **Smart Tester** | URL pre-check: detects Cloudflare, JS requirements, TLS errors before creating jobs |
| **Data Storage** | Parquet (Snappy) + PostgreSQL + Redis + MongoDB + ClickHouse + S3 |
| **Analytics** | EDA profiles (YData), DuckDB SQL, Polars, Pandas, Dask, PySpark |
| **ML / AI** | XGBoost, LightGBM, TensorFlow, PyTorch, Prophet, Optuna HPO, MLflow tracking |
| **Pipelines** | Visual ETL editor (ReactFlow), PySpark, Celery task chaining |
| **Onboarding** | Spotlight tour system — module-specific interactive guides |
| **Exports** | CSV, Excel, JSON, Parquet, BigQuery, S3, Azure Blob |
| **Deployment** | Docker Compose — 11-service orchestration, Nginx, Flower monitoring |
| **Performance** | Cython hot paths, C-extension parsers, optional Rust/Zig acceleration layers |
| **Dev Tooling** | Cross-platform console CLI (`scripts/cli.js`) — works on Windows without `make`/`tmux` — plus automatic Pydantic → TypeScript type generation |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                          │
│   React 19 · TanStack Router · TanStack Query · Zustand         │
│   Recharts · Plotly · ReactFlow · Socket.IO Client              │
└───────────────────────┬─────────────────────────────────────────┘
                        │  HTTP + WebSocket
┌───────────────────────▼─────────────────────────────────────────┐
│                     Flask API  (port 5050)                       │
│   Blueprints: scraper · tables · analytics · ai · pipelines     │
│   Flask-SocketIO · Flask-Caching · Flask-Limiter · Flasgger     │
└───────────┬───────────────────────────────────────┬─────────────┘
            │  Celery tasks                          │  SQLAlchemy
┌───────────▼──────────┐              ┌─────────────▼────────────┐
│     Celery Workers   │              │      PostgreSQL 16        │
│  ┌──────────────┐    │              │  scraper_jobs             │
│  │  scraping Q  │◄──►│  Redis 7    │  pipelines                │
│  │  analytics Q │    │  (broker +  │  datasets                 │
│  │  ai Q        │    │   results)  │  ml_models                │
│  │  pipelines Q │    │             │  job_logs                 │
│  └──────┬───────┘    │              └──────────────────────────┘
└─────────┼────────────┘
          │  HTTP + x-api-key (fail-open)          Redis DB 3
┌─────────▼──────────────────────────────────────────────────────┐
│        ratelimiter — Rust / Axum sidecar  (port 8090)          │
│   Shared outbound scrape rate-limiting + URL dedup across all  │
│   Celery worker processes. /rate/check · /dedup/check · /health│
└───────────────────────┬────────────────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────────────┐
│               Native Performance Layer                         │
│  Cython (.pyx)   C/C++ extensions   Rust bindings (optional)  │
│  scraper_core    parser_core         zig_parser (optional)     │
│  analytics_core  html_parser.c       rust_extractor            │
└───────────────────────────────────────────────────────────────┘
```

---

## Stack

### Frontend
| Tech | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| TanStack Start | 1.x | SSR / meta-framework |
| TanStack Router | latest | File-based routing |
| TanStack Query | latest | Server state + caching |
| Tailwind CSS | v4 | Utility-first styling |
| Zustand | 5 | Client state (Immer + persist) |
| Recharts | latest | Dashboard charts |
| Plotly | latest | Advanced visualizations |
| Socket.IO Client | latest | Real-time WebSocket |
| ReactFlow | latest | Visual pipeline editor |
| Lucide React | latest | Icon system |
| Zod | latest | Schema validation |
| Vite | 7 | Build tool |

### Backend — Python
| Tech | Version | Purpose |
|------|---------|---------|
| Flask | 3.0.3 | REST API |
| Celery | 5.5 | Distributed task queue |
| SQLAlchemy | 2.0 | ORM + migrations (Alembic) |
| Polars | 1.3 | High-performance DataFrames |
| Pandas | 2.2 | DataFrame processing |
| DuckDB | latest | In-process analytical SQL |
| PyArrow | latest | Parquet I/O |
| Dask | 2026 | Distributed computing |
| PySpark | 4.1 | Big data processing |
| Playwright | latest | Browser automation (JS sites) |
| Selenium | 4.23 | Browser automation (forms) |
| CloudScraper | 1.2.71 | Cloudflare bypass |
| Scrapy | 2.11 | Large-scale crawling |
| XGBoost | latest | Gradient boosting |
| TensorFlow | 2.21 | Deep learning |
| PyTorch | latest | Research / neural nets |
| Prophet | 1.3 | Time-series forecasting |
| MLflow | latest | Experiment tracking |
| Numba | latest | JIT-compiled NumPy |

### Backend — Infrastructure
| Service | Version | Purpose |
|---------|---------|---------|
| PostgreSQL | 16 | Primary relational store |
| Redis | 7 | Broker + result backend + cache |
| MongoDB | 7 | Document store (raw payloads) |
| ClickHouse | latest | Columnar analytics (optional) |
| Elasticsearch | latest | Full-text search (optional) |
| MLflow | latest | ML experiment UI |
| Flower | latest | Celery monitoring UI |
| Nginx | alpine | Reverse proxy + static serving |

### Backend — Sidecar services

| Tech | Version | Purpose |
|------|---------|---------|
| Rust + Axum | 2021 edition | `ratelimiter/` — outbound scrape rate-limiting + URL dedup, shared across Celery worker processes (port 8090). Talks HTTP/JSON, state in Redis DB 3, fail-open. |

---

## Performance

DataHarvest uses multiple native acceleration strategies depending on the workload.

### Cython Extensions

Hot paths compiled to C for 10–50× speedup over pure Python:

```
app/scrapers/scraper_core.pyx   — URL parsing, header normalization, response chunking
app/analytics/analytics_core.pyx — DataFrame transforms, aggregation pipelines
app/utils/parser_core.pyx        — HTML tokenizer, CSS selector engine
```

Build all extensions:
```bash
python setup.py build_ext --inplace
```

### C / C++ Extensions

Low-level parsing modules callable from Python via `ctypes` or `cffi`:

```
native/html_parser.c    — Fast HTML tokenizer (ANSI C, no deps)
native/csv_writer.cpp   — Vectorized CSV serialization (C++17 + SIMD)
```

Build:
```bash
# C extension
gcc -O3 -march=native -shared -fPIC -o html_parser.so native/html_parser.c

# C++ extension
g++ -O3 -std=c++17 -march=native -shared -fPIC -o csv_writer.so native/csv_writer.cpp
```

### Rust Bindings (optional)

For regex-heavy extraction and parallel URL filtering, a Rust crate provides ~100× over Python `re`:

```
rust_ext/          — Cargo workspace
  src/extractor.rs         — Parallel regex extraction (rayon)
  src/url_filter.rs        — Bloom-filter URL dedup
  src/lib.rs               — PyO3 bindings
```

Build and install:
```bash
cd rust_ext
pip install maturin
maturin develop --release
```

Enable in settings:
```env
USE_RUST_EXTRACTOR=true
```

### Zig Parser (optional)

Ultra-low-latency JSON/HTML streaming parser for massive payloads:

```
zig_parser/
  src/json_stream.zig      — Streaming JSON tokenizer
  src/html_stream.zig      — HTML5 streaming parser
  build.zig                — Build configuration
```

Build:
```bash
cd zig_parser
zig build -Doptimize=ReleaseFast
# Outputs: zig-out/lib/libzig_parser.so
```

Load from Python:
```python
import ctypes
_lib = ctypes.CDLL("zig_parser/zig-out/lib/libzig_parser.so")
```

### Assembly Hotspots

Critical inner loops (hashing, checksums, bit-manipulation) have hand-written x86-64 Assembly:

```
asm/
  url_hash.asm             — FNV-1a 64-bit hash (AVX2 vectorized)
  crc32c.asm               — CRC32C for data integrity checks
```

Assemble:
```bash
nasm -f elf64 -o url_hash.o asm/url_hash.asm
ld -shared -o url_hash.so url_hash.o
```

### Performance Notes

- All native layers are **optional** — the pure-Python fallback is always available.
- Enable/disable per-extension via `.env` flags (`USE_RUST_EXTRACTOR`, `USE_ZIG_PARSER`, `USE_ASM_HASH`).
- Cython extensions are **always compiled** during setup — they require only a C compiler.
- On Windows, build Rust/Zig extensions in WSL2 and copy the `.so` output.

---

## Project Structure

Backend and frontend live side by side at the repo root — one `package.json`,
one `.venv`, one `.env`, one `npm install` / `node scripts/cli.js install`. No
`cd backend` / `cd frontend` for anything.

```
DataHarvest/
├── src/                          Frontend (React 19 + TanStack Start)
│   ├── components/
│   │   ├── layout/               AppShell, Sidebar, TopBar
│   │   ├── onboarding/           TourManager, TourSpotlight, TourTooltip, tours
│   │   └── ui/                   Button, Badge, Panel, Spinner, CodeBlock
│   ├── hooks/                    useApi, useSystemMetrics, useWebSocket
│   ├── lib/
│   │   ├── api.ts                 axios instance, socket.io client, typed API namespaces
│   │   └── types.generated.ts     AUTO-GENERATED — do not edit, see `npm run gen:types`
│   ├── pages/                    Dashboard, Scraper, Analytics, DataTables,
│   │                              Pipelines, AIStudio, Reports, Monitor, Settings
│   ├── routes/                   TanStack Router file-based routes
│   ├── stores/                   appStore.ts (Zustand — theme, sidebar, jobs)
│   └── styles.css                Design tokens, component classes
├── public/                       dataharvest_logo.svg, favicon
├── content/                      content-collections markdown sources
│
├── app/                          Backend (Flask + Celery)
│   ├── api/                      scraper.py, tables.py, analytics.py, ai.py,
│   │                              pipelines.py, exports.py, health.py, monitor.py
│   ├── core/                     config.py, database.py, celery_app.py, socket_events.py
│   ├── scrapers/
│   │   ├── engines/              scraper_engine.py (Playwright/Selenium/Requests/CloudScraper)
│   │   └── scraper_core.pyx      Cython-compiled hot path
│   ├── analytics/
│   │   ├── engines/              analytics_engine.py (DataProfiler, ChartGenerator)
│   │   └── analytics_core.pyx
│   ├── tasks/                    scraper_tasks.py, pipeline_tasks.py, analytics_tasks.py,
│   │                              ai_tasks.py, export_tasks.py, monitor_tasks.py
│   ├── schemas/                  requests.py (Pydantic v2 models — source of truth for TS types)
│   ├── middleware/                auth.py (JWT)
│   ├── core/
│   │   └── ratelimiter_client.py  httpx client for the Rust sidecar (fail-open)
│   └── utils/
│       ├── helpers.py
│       └── parser_core.pyx       Cython HTML parser
│
├── ratelimiter/                  Rust / Axum sidecar — scrape rate-limit + URL dedup
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs               bootstrap: env, redis conn, router, serve
│       ├── config.rs state.rs auth.rs error.rs
│       └── routes/               health.rs · rate.rs · dedup.rs
│
├── native/                       C/C++ extension sources (optional)
├── rust_ext/                     Rust + PyO3 crate (optional)
├── zig_parser/                   Zig streaming parser (optional)
├── asm/                          x86-64 ASM hotspots (optional)
├── data/
│   ├── scraped/                  Parquet output files
│   └── uploads/                  Uploaded datasets
├── migrations/                   Alembic migration scripts
├── tests/                        pytest test suite
├── requirements.txt
├── setup.py                      Cython build configuration
├── run.py                        Backend entry point
├── worker.py                     Celery worker entry point
│
├── scripts/
│   ├── cli.js                    Unified console CLI — dev/backend/frontend/worker/beat/
│   │                              docker/test/lint/migrate/gen-types (cross-platform, no make/tmux needed)
│   ├── export_schema.py          Dumps Pydantic schemas → JSON Schema (feeds gen-types.mjs)
│   └── gen-types.mjs             Pydantic JSON Schema → TypeScript compiler
│
├── .venv/                        Python virtualenv (gitignored, created by `install`)
├── node_modules/                 (gitignored, created by `npm install`)
│
├── Dockerfile.backend  Dockerfile.frontend  Dockerfile.ratelimiter  nginx.conf
├── docker-compose.yml
├── Makefile                      Unix shortcuts (Linux/macOS) — see scripts/cli.js on Windows
├── package.json                  `npm run cli -- <command>`
├── tsconfig.json  vite.config.ts  vitest.config.ts  biome.json  eslint.config.js
├── .env  .env.example
├── README.md
└── README.es.md
```

---

## Quick Start

### Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Python | 3.11+ | 3.12 recommended |
| Node.js | 20+ | LTS version |
| PostgreSQL | 16+ | or use Docker |
| Redis | 7+ | WSL2 on Windows |
| Docker | 24+ | optional, for full stack |
| C compiler | gcc / clang | required for Cython |
| Rust / Cargo | 1.78+ | optional — builds the `ratelimiter/` sidecar; `node scripts/cli.js dev` skips it (fail-open) if cargo isn't installed |
| Zig | 0.13+ | optional, for zig_parser |
| ASM (nasm/gas) | 2.16+ | optional, for ASM modules |

---

### Option A — Docker (recommended for first run)

The fastest way to get all services running:

```bash
# 1. Clone
git clone https://github.com/Brashkie/DataHarvest.git
cd DataHarvest

# 2. Copy environment template
cp .env.example .env
# Edit .env — set secrets, API keys

# 3. Build and start all 11 services
docker-compose up --build

# 4. Open
#   Frontend: http://localhost
#   API docs: http://localhost:5050/api/docs/
#   Flower:   http://localhost:5555
#   MLflow:   http://localhost:5001
```

To run only specific services:
```bash
# API + databases only (no frontend build)
docker-compose up api postgres redis mongo

# Frontend dev with hot-reload against running API
npm run dev:frontend
```

---

### Option B — Local Development (full control)

**Step 1 — Clone the repository**
```bash
git clone https://github.com/Brashkie/DataHarvest.git
cd DataHarvest
```

**Step 2 — Python virtual environment**
```bash
# Create and activate venv
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate
```

**Step 3 — Install backend dependencies**
```bash
# Python packages
pip install -r requirements.txt

# Playwright browsers
playwright install chromium firefox

# Build Cython extensions (requires gcc/clang)
python setup.py build_ext --inplace
```

Or skip Steps 2–3 entirely: `node scripts/cli.js install` creates the venv and
installs everything for you.

**Step 4 — Configure environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
APP_ENV=development
APP_SECRET_KEY=change-me-in-production
APP_PORT=5050

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/dataharvest

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Scraping
PLAYWRIGHT_HEADLESS=true
REQUEST_TIMEOUT=30
MAX_CONCURRENT_SCRAPERS=10

# Native extensions (optional)
USE_RUST_EXTRACTOR=false
USE_ZIG_PARSER=false
USE_ASM_HASH=false

# AI / ML (optional)
OPENAI_API_KEY=
HUGGINGFACE_TOKEN=
MLFLOW_TRACKING_URI=http://localhost:5001
```

**Step 5 — Database setup**
```bash
# Start PostgreSQL and Redis first (or via Docker)
docker-compose up postgres redis mongo -d

# Run migrations
flask --app run db upgrade

# Seed demo data (optional)
python run.py seed
```

**Step 6 — Frontend dependencies**
```bash
npm install
```

**Step 7 — Run everything**

One command starts the Flask API, the Vite dev server and a Celery worker
together (labeled, colorized output — Ctrl+C stops all three):
```bash
npm run dev
# or: node scripts/cli.js dev
```

Prefer separate terminals for finer control? Each of these auto-detects the
venv, so no activation step is needed:
```bash
node scripts/cli.js backend   # Terminal 1 — Flask API
node scripts/cli.js worker    # Terminal 2 — Celery worker (all queues)
node scripts/cli.js beat      # Terminal 3 — Celery beat (periodic tasks)
node scripts/cli.js frontend  # Terminal 4 — Vite dev server
```

**Step 8 — Open the app**
```
Frontend:   http://localhost:3000
API:        http://localhost:5050
API Docs:   http://localhost:5050/api/docs/
Flower:     http://localhost:5555   (after: celery -A run.celery flower)
MLflow:     http://localhost:5001   (after: mlflow ui --port 5001)
```

---

### Option C — Makefile shortcuts (Linux / macOS)

```bash
make install      # Install backend + frontend deps + Cython
make dev          # Start full dev stack (requires tmux or multiple terminals)
make backend      # Start Flask API only
make frontend     # Start Vite dev server
make worker       # Start Celery worker (all queues)
make beat         # Start Celery beat
make ratelimiter  # Start the Rust rate-limiter/dedup sidecar (localhost:8090)
make flower       # Start Flower monitoring UI
make docker       # Start full stack via Docker Compose
make test         # Run pytest with coverage report
make lint         # black + ruff on app/
make type-check   # mypy on app/
make migrate      # flask db upgrade
make seed         # Seed demo data
make build-ext    # Compile Cython extensions
make build-rust   # Build Rust extension (requires Rust + maturin)
make build-zig    # Build Zig parser (requires Zig toolchain)
```

---

### Option D — Console CLI (`scripts/`, cross-platform)

`make` and `tmux` aren't available on Windows by default, so `scripts/cli.js` is a
dependency-free Node script that does the same job on Windows, Linux and macOS.
It auto-detects the venv (`.venv/Scripts/python.exe` on Windows, `.venv/bin/python`
elsewhere) and shells out to the same commands the Makefile runs.

```bash
node scripts/cli.js <command>       # or: npm run cli -- <command>

node scripts/cli.js dev             # backend + frontend together, labeled/colorized output, Ctrl+C stops both
node scripts/cli.js backend         # Flask API only (http://localhost:5050)
node scripts/cli.js frontend        # Vite dev server only (http://localhost:3000)
node scripts/cli.js worker          # Celery worker (all queues)
node scripts/cli.js beat            # Celery beat scheduler
node scripts/cli.js ratelimiter     # Rust rate-limiter/dedup sidecar (http://localhost:8090, needs cargo)
node scripts/cli.js flower          # Flower UI (http://localhost:5555)
node scripts/cli.js worker+beat     # worker + beat together
node scripts/cli.js docker          # docker compose up --build -d
node scripts/cli.js docker:down     # docker compose down
node scripts/cli.js test [backend|frontend]
node scripts/cli.js lint            # black + ruff on app/
node scripts/cli.js migrate         # flask db upgrade
node scripts/cli.js seed            # Seed demo data
node scripts/cli.js build-ext       # Compile Cython extensions
node scripts/cli.js gen-types       # Regenerate src/lib/types.generated.ts
node scripts/cli.js install         # Install backend + frontend deps (creates ./.venv if missing)
node scripts/cli.js help            # List all commands
```

Shortcuts are also wired into the root `package.json`: `npm run dev`, `npm run backend`,
`npm run frontend`, `npm run worker`, `npm run beat`, `npm run gen-types`.

---

## Python → TypeScript Type Bridge

Request/response shapes are defined **once**, as Pydantic models in
[`app/schemas/requests.py`](app/schemas/requests.py) — the frontend
never hand-writes a parallel copy of those types, so the two layers can't silently drift.

```
app/schemas/requests.py   Pydantic v2 models (source of truth)
        │  python scripts/export_schema.py
        ▼
   JSON Schema  ($defs keyed by model name)
        │  scripts/gen-types.mjs  (json-schema-to-typescript)
        ▼
src/lib/types.generated.ts   AUTO-GENERATED — do not edit by hand
        │  imported directly into
        ▼
src/lib/api.ts  +  src/hooks/useApi.ts
```

Regenerate after changing any model in `requests.py`:

```bash
node scripts/cli.js gen-types
# or
npm run gen:types
```

Commit the resulting diff to `types.generated.ts` — it's tracked in git so a full
Python checkout / venv isn't required just to build the frontend (e.g. in the
Docker frontend build stage or CI). `scripts/export_schema.py` can also be run
standalone if you need the raw JSON Schema for another consumer
(`python scripts/export_schema.py --out schema.json`).

---

## Database Models

| Table | Purpose |
|-------|---------|
| `scraper_jobs` | Job records — status, config, result path, timing |
| `scraper_profiles` | Reusable scraper configurations |
| `pipelines` | ETL pipeline definitions (ReactFlow JSON) |
| `pipeline_runs` | Execution history per pipeline |
| `datasets` | Dataset metadata — Parquet file references |
| `ml_models` | Trained model registry — metrics, artifact paths |
| `job_logs` | Streaming log lines per job |
| `export_jobs` | Async export task records |

---

## Scraping Engines

| Engine | Best For | JS Support | Speed |
|--------|---------|-----------|-------|
| `auto` | Automatic selection (recommended) | Detected | Varies |
| `playwright` | SPAs, React/Vue/Angular apps | Full | Medium |
| `selenium` | Forms, auth flows, clicks | Full | Slow |
| `requests` | Static HTML, REST APIs | No | Fast |
| `cloudscraper` | Cloudflare-protected sites | Limited | Medium |
| `scrapy` | Large-scale multi-URL crawls | No | Very Fast |

Engine auto-selection logic:
1. HEAD request to probe the URL
2. Detect Cloudflare (`cf-ray` header, JS challenge)
3. Detect JS-heavy content (`window.__NEXT_DATA__`, Vue/React markers)
4. Fall back in order: `playwright → cloudscraper → requests`

---

## Rate-limiter / dedup sidecar (Rust)

`ratelimiter/` is a small standalone **Rust + Axum** service that gives the
scraper pipeline two things the Python side can't do well on its own: shared
per-domain **rate limiting** and short-window URL **deduplication** that are
consistent across *all* Celery worker processes (on Linux/macOS the scraping
queue runs 4 separate OS processes — in-process Python state wouldn't be shared
between them). State lives in Redis (DB 3, isolated from the cache/broker/results
DBs at 0/1/2).

It follows the same pattern used elsewhere in the author's projects: an isolated
sibling service reached over plain HTTP/JSON on localhost, authenticated with a
shared `x-api-key` header, and **fail-open** — the Python client
([`app/core/ratelimiter_client.py`](app/core/ratelimiter_client.py)) has a short
(~500 ms) timeout and, if the sidecar is slow or down, logs a warning and lets
the scrape proceed. A sidecar outage never blocks or fails a job; you just
temporarily lose shared rate-limiting/dedup.

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /health` | no | Liveness — always `200` if up; reports Redis reachability in the body |
| `POST /rate/check` | yes | Atomic per-second, per-domain counter (`INCR`+`EXPIRE` via a Lua script). Returns `{allowed, current, limit, retry_after_ms}` |
| `POST /dedup/check` | yes | Atomic check-and-mark (`SET … NX EX`), keyed by `sha256(url)`, with a TTL window. Returns `{seen, ttl_secs}` |

The gate is invoked once per URL from the engine's `scrape()` chokepoint: if a
URL is a duplicate within the window the job short-circuits to a `completed`
result with `rows=0` / `pages=0` (logged as `skipped_reason:
duplicate_url_within_window`); otherwise it scrapes normally.

Run it standalone (needs Rust/Cargo + Redis):
```bash
node scripts/cli.js ratelimiter    # or: cd ratelimiter && cargo run
```
It also starts automatically as part of `node scripts/cli.js dev` when `cargo`
is on `PATH`. Config is via `RATELIMITER_*` env vars (see
[Configuration Reference](#configuration-reference)).

> **v1 limitations (documented):** the per-domain limit is a single global
> `RATELIMITER_DEFAULT_MAX_RPS` (per-profile `rate_limit` wiring is a follow-up);
> Playwright's internal pagination loop makes multiple fetches per `scrape()`
> call that don't each pass through the gate; the `test_url` preview endpoint
> bypasses the gate entirely.

---

## API Reference

Base URL: `http://localhost:5050/api/v1`  
Interactive docs: `http://localhost:5050/api/docs/`

### Health
```
GET  /health/                    System health + service connectivity
GET  /health/metrics             CPU, memory, disk, Redis, DB stats
```

### Scraper
```
GET  /scraper/jobs               List all jobs (pagination, filters)
POST /scraper/jobs               Create a new scraping job
GET  /scraper/jobs/:id           Get job details + progress
DEL  /scraper/jobs/:id           Cancel / delete job
GET  /scraper/jobs/:id/results   Download job result (Parquet/JSON/CSV)
POST /scraper/test-url           Test URL reachability + engine recommendation
```

### Tables (Datasets)
```
GET  /tables/datasets            List uploaded datasets
POST /tables/datasets/upload     Upload CSV / Parquet / Excel
GET  /tables/datasets/:id        Dataset schema + preview rows
DEL  /tables/datasets/:id        Delete dataset
GET  /tables/datasets/:id/export/:fmt   Export (csv|json|parquet|xlsx)
POST /tables/datasets/:id/query  Run DuckDB SQL query on dataset
```

### Analytics
```
POST /analytics/profile          Run EDA profile (YData / Pandas Profiling)
POST /analytics/chart            Generate Plotly / Matplotlib chart
POST /analytics/correlations     Correlation matrix
POST /analytics/anomalies        Anomaly detection
```

### AI / ML
```
POST /ai/train                   Train model (XGBoost, LightGBM, TF, sklearn)
POST /ai/predict                 Run prediction on new data
POST /ai/forecast                Time-series forecast (Prophet)
GET  /ai/models                  List trained models
GET  /ai/models/:id              Model details + metrics
DEL  /ai/models/:id              Delete model
```

### Pipelines
```
GET  /pipelines                  List ETL pipelines
POST /pipelines                  Create pipeline (ReactFlow definition)
GET  /pipelines/:id              Pipeline details
PUT  /pipelines/:id              Update pipeline
POST /pipelines/:id/run          Execute pipeline
GET  /pipelines/:id/runs         Execution history
```

### Monitor
```
GET  /monitor/jobs               Live job queue state
GET  /monitor/workers            Celery worker status
GET  /monitor/system             CPU / memory / disk (live)
GET  /monitor/logs/:job_id       Streaming logs for a job
```

---

## Configuration Reference

### Environment Variables

```env
# ── App ──────────────────────────────────────────────────────────
APP_ENV=development           # development | production | test
APP_SECRET_KEY=               # required in production
APP_PORT=5050
APP_DEBUG=false

# ── Databases ────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:pass@localhost:5432/dataharvest
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
MONGO_URL=mongodb://localhost:27017/dataharvest  # optional

# ── Scraping ─────────────────────────────────────────────────────
PLAYWRIGHT_HEADLESS=true
REQUEST_TIMEOUT=30
MAX_CONCURRENT_SCRAPERS=10
USER_AGENT_ROTATE=true
PROXY_URL=                    # optional: http://user:pass@proxy:port

# ── Rate-limiter / dedup sidecar (Rust) ──────────────────────────
RATELIMITER_HOST=localhost
RATELIMITER_PORT=8090
RATELIMITER_REDIS_URL=redis://localhost:6379/3   # DB 3 — isolated from cache/broker/results
RATELIMITER_API_KEY=change-me-ratelimiter-shared-secret
RATELIMITER_DEFAULT_MAX_RPS=2                     # per-domain requests/sec ceiling
RATELIMITER_DEDUP_TTL_SECS=3600                   # URL dedup window

# ── Storage ──────────────────────────────────────────────────────
STORAGE_BACKEND=local         # local | s3 | azure
S3_BUCKET=
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AZURE_STORAGE_CONNECTION_STRING=

# ── Native Extensions ────────────────────────────────────────────
USE_RUST_EXTRACTOR=false      # enable Rust regex extractor (PyO3)
USE_ZIG_PARSER=false          # enable Zig streaming parser
USE_ASM_HASH=false            # enable ASM FNV hash (x86-64 only)

# ── AI / ML ──────────────────────────────────────────────────────
OPENAI_API_KEY=
HUGGINGFACE_TOKEN=
MLFLOW_TRACKING_URI=http://localhost:5001

# ── Monitoring ───────────────────────────────────────────────────
FLOWER_PORT=5555
SENTRY_DSN=                   # optional
```

---

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `api` | 5050 | Flask REST API + SocketIO |
| `worker-scraping` | — | Celery worker (scraping queue, 4 workers) |
| `worker-ai` | — | Celery worker (ai + analytics queues, 2 workers) |
| `worker-general` | — | Celery worker (pipelines + exports + monitoring) |
| `beat` | — | Celery periodic task scheduler |
| `ratelimiter` | 8090 | Rust/Axum scrape rate-limit + URL dedup sidecar |
| `flower` | 5555 | Celery monitoring UI |
| `frontend` | 80, 443 | Nginx + Vite production build |
| `postgres` | 5432 | PostgreSQL 16 |
| `redis` | 6379 | Redis 7 (AOF persistence) |
| `mongo` | 27017 | MongoDB 7 |
| `mlflow` | 5001 | MLflow tracking server |

---

## Testing

```bash
# Backend — full test suite
pytest tests/ -v --cov=app --cov-report=term-missing

# Specific module
pytest tests/test_scraper.py -v

# Integration tests (requires running DB + Redis)
pytest tests/integration/ -v --env=test

# Frontend tests
npm run test
```

Or via the CLI: `node scripts/cli.js test` (backend) / `node scripts/cli.js test frontend`.

---

## Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Write tests** for new functionality — especially for native extensions
4. **Compile Cython** if you modified `.pyx` files: `python setup.py build_ext --inplace`
5. **Run linters**: `make lint && make type-check`
6. **Run tests**: `make test`
7. **Commit** with a descriptive message
8. **Open a Pull Request** against `main`

### Adding a Native Extension

When contributing a performance-critical feature, consider a native implementation:

- **Cython** — for Python-adjacent code with NumPy or memory views
- **C/C++** — for pure parsing, hashing, or compression
- **Rust** — for safe concurrency, regex, or cryptographic operations
- **Zig** — for memory-safe systems programming without a GC
- **ASM** — only for verified bottlenecks where SIMD gives measurable gain

Each native module must have:
- A pure-Python fallback in the same file
- A unit test validating output matches the Python reference
- A benchmark script under `benchmarks/`

---

## Roadmap

The roadmap is organized by platform focus. Each item lists the **target language / technology** chosen for that specific problem — the goal is always to use the right tool, not the most popular one.

Legend: `[ ]` planned &nbsp;·&nbsp; `[~]` in progress &nbsp;·&nbsp; `[x]` done

---

### Scraping Engine

> Goal: parse any page, at any scale, with minimum latency per request.

| Status | Item | Language / Tech | Why |
|--------|------|-----------------|-----|
| `[ ]` | Streaming HTML5 tokenizer for >1 GB pages | **Zig** | Zero-allocation, compile-time memory layout, no GC pauses |
| `[ ]` | Parallel regex extraction pipeline | **Rust** (rayon + regex crate) | True parallelism, SIMD-accelerated DFA, memory-safe |
| `[~]` | URL deduplication shared across workers | **Rust** (Axum) + Redis | Shipped as the `ratelimiter/` sidecar — atomic `SET NX EX` hash dedup with a TTL window; a bloom-filter variant is a possible refinement |
| `[ ]` | FNV-1a / xxHash URL fingerprinting | **x86-64 ASM** (AVX2) | Vectorized — 8 URLs/cycle throughput |
| `[ ]` | HTTP/3 (QUIC) scraping client | **Rust** (quinn) | 0-RTT reconnects, multiplexed streams, no head-of-line blocking |
| `[ ]` | Browser fingerprint rotation at TLS level | **C** (libcurl + openssl) | Fine-grained TLS control unavailable in Python |
| `[ ]` | WASM in-browser HTML preview parser | **Zig → WASM** | Same tokenizer shipped to the browser — no JS rewrite |
| `[ ]` | Distributed crawler mesh (multi-node) | **Python** + Redis Streams | Horizontal scale, shared dedup across workers |
| `[ ]` | Plugin SDK for custom scraping engines | **Python** (ABC + entry_points) | Third-party engines without forking the repo |

---

### Data Processing & Storage

> Goal: process terabytes in-process and push bytes to storage at wire speed.

| Status | Item | Language / Tech | Why |
|--------|------|-----------------|-----|
| `[ ]` | Vectorized CSV serializer | **C++17** (SIMD intrinsics) | 10× faster than Python `csv` module on bulk export |
| `[ ]` | Zero-copy Arrow Flight dataset streaming | **Rust** (arrow2 + flight) | No serde overhead — columnar buffers sent directly |
| `[ ]` | Delta Lake write support (ACID on S3/GCS) | **Rust** (delta-rs) | Transactional overwrites, schema evolution, time travel |
| `[ ]` | Parquet predicate pushdown query engine | **Zig** + Arrow IPC | Sub-second WHERE without loading full file into memory |
| `[ ]` | CRC32C data integrity layer | **x86-64 ASM** (SSE4.2) | Hardware `crc32` instruction — 1 byte/cycle |
| `[ ]` | Column-store Zstd dictionary compression | **C** (libzstd) | Shared dict trained on domain data — 3× better ratio |
| `[ ]` | ClickHouse materialized views for aggregations | **SQL + ClickHouse** | Real-time rollups on scraped event streams |
| `[ ]` | DuckDB / Polars zero-copy Arrow bridge | **C++** + pybind11 | Single shared Arrow buffer — no copy between engines |

---

### Analytics & Visualization

> Goal: from raw bytes to insight in one pipeline, explorable entirely in the browser.

| Status | Item | Language / Tech | Why |
|--------|------|-----------------|-----|
| `[ ]` | SIMD-accelerated summary statistics | **C** (AVX2) via Cython memoryview | min/max/mean/stddev in one cache-friendly pass |
| `[ ]` | Approximate heavy-hitters (Count-Min Sketch) | **Rust** | Lock-free concurrent updates, safe FFI to Python |
| `[ ]` | Time-series anomaly detection (sliding z-score) | **Python** + **Cython** hot path | Compiled windowed loop — no per-row Python overhead |
| `[ ]` | GPU-accelerated chart rendering (10M+ points) | **GLSL** (WebGL / regl) | 60 fps scatter plot in browser, zero server round-trip |
| `[ ]` | Canvas-based pivot table (DOM-free) | **TypeScript** + OffscreenCanvas | No React reconciliation overhead per data row |
| `[ ]` | SQL notebook cells (DuckDB WASM) | **Zig-compiled DuckDB** + TypeScript | Queries run fully client-side — no backend needed |
| `[ ]` | Correlation matrix with p-values | **C** (BLAS/LAPACK) via NumPy | Native BLAS matmul — orders of magnitude faster than pure Python |

---

### ML / AI Studio

> Goal: train, evaluate, and serve models at the data layer — no separate MLOps cluster needed.

| Status | Item | Language / Tech | Why |
|--------|------|-----------------|-----|
| `[ ]` | Feature store (point-in-time correct joins) | **Rust** (polars-core) | Temporal join correctness — no GIL contention on large frames |
| `[ ]` | AutoML pipeline (HPO + ensembling) | **Python** + Optuna + **C** sampler | Optuna TPE sampler compiled to C — 5× more trials/sec |
| `[ ]` | ONNX runtime inference endpoint | **C++** (onnxruntime) | CPU inference <5 ms p99, no TF/PyTorch loading overhead |
| `[ ]` | LLM-assisted scraper config generator | **Python** + Anthropic API | Describe a site in plain text, get a `ScrapeConfig` back |
| `[ ]` | Embedding-based duplicate content detection | **Rust** (fastembed-rs) | Batch embed + cosine dedup — no Python GIL overhead |
| `[ ]` | Streaming LLM inference (chunked SSE) | **Python** + Flask SSE | Real-time token streaming to the frontend |
| `[ ]` | Quantized model serving (INT8 / FP16) | **C++** + OpenBLAS | Half-precision matmul — 2× throughput on CPU nodes |
| `[ ]` | Federated scraping + local ML (edge nodes) | **Rust** + gRPC | Nodes scrape and train locally — raw data never leaves the node |

---

### Pipelines & ETL

> Goal: compose arbitrarily complex data flows visually; execute them reliably at scale.

| Status | Item | Language / Tech | Why |
|--------|------|-----------------|-----|
| `[ ]` | gRPC pipeline execution API | **Python** + Protobuf | Typed, versioned contracts — replaces REST for inter-service calls |
| `[ ]` | DAG cycle detection at save time | **Rust** (petgraph) | Compile-time correct DFS exposed as a Python validation call |
| `[ ]` | Incremental / delta pipeline runs | **Python** + Parquet snapshots | Skip unchanged partitions — only reprocess deltas |
| `[ ]` | Pipeline as code (YAML / TOML DSL) | **Python** + PyYAML | Version-controllable, diffable pipeline definitions |
| `[ ]` | Streaming transform nodes (Kafka source) | **Python** + confluent-kafka | Stateful aggregations over live topics |
| `[ ]` | Pipeline cost estimator (time + memory) | **Zig** + static analysis | Predict resource usage before running — prevent OOM kills |
| `[ ]` | ReactFlow nodes → PySpark / Polars codegen | **TypeScript** + **Python** | Visual pipeline compiles to a runnable compute chain |

---

### API & Backend Infrastructure

> Goal: 10 k req/s on a single node, fully observable, zero-downtime deploys.

| Status | Item | Language / Tech | Why |
|--------|------|-----------------|-----|
| `[ ]` | OpenTelemetry tracing (Jaeger / Tempo) | **Python** (opentelemetry-sdk) | Distributed traces across Flask + Celery + workers |
| `[ ]` | Prometheus metrics + Grafana dashboard | **Python** (prometheus-client) | CPU/memory/job stats — alert on SLA breach |
| `[x]` | Outbound scrape rate limiter in Redis | **Rust** (Axum) + **Lua** (Redis scripted atomics) | Shipped as `ratelimiter/` — atomic fixed-window `INCR`+`EXPIRE` per domain, shared across workers, fail-open (token-bucket precision is a future refinement) |
| `[ ]` | Zero-downtime rolling deploys | **Python** + Gunicorn + Nginx | Graceful worker restart — no dropped connections |
| `[ ]` | JWT → OAuth 2.0 / OIDC migration | **Python** (Authlib) | Multi-tenant, provider-agnostic identity |
| `[ ]` | WebAssembly plugin sandbox | **Rust** (wasmtime) | Untrusted user transform code isolated with CPU/mem limits |
| `[ ]` | Async task result streaming via SSE | **Python** + Flask + Redis Pub/Sub | Push Celery updates to frontend without polling |

---

### Frontend & UI

> Goal: a UI that feels native-fast even with hundreds of thousands of rows rendered live.

| Status | Item | Language / Tech | Why |
|--------|------|-----------------|-----|
| `[ ]` | Virtualized data table (1M+ rows) | **TypeScript** + canvas | DOM-free row rendering — no React VDOM overhead per row |
| `[ ]` | WASM CSV parser in-browser (200 MB+) | **Zig → WASM** | Parse large files on the client in <1 s — no upload needed |
| `[ ]` | Offline-first mode (IndexedDB + Service Worker) | **TypeScript** + Workbox | Cache datasets locally, run DuckDB WASM queries offline |
| `[ ]` | Command palette (⌘K, fuzzy nav) | **TypeScript** + cmdk | Instant navigation across all modules and datasets |
| `[ ]` | Responsive data grid (mobile-first) | **TypeScript** + CSS Grid | Pinned columns, touch swipe, adaptive column hiding |
| `[ ]` | Custom theme editor (export JSON) | **TypeScript** + CSS custom properties | Share branded themes with the entire team |
| `[ ]` | PWA install + job-done push notifications | **TypeScript** + Web Push API | Notify when a scrape finishes — even with the browser closed |

---

### DevOps & Deployment

> Goal: one command from laptop to production; bit-for-bit reproducible builds across platforms.

| Status | Item | Language / Tech | Why |
|--------|------|-----------------|-----|
| `[ ]` | Kubernetes Helm chart | **YAML** + Helm 3 | Parameterized multi-env deploys, HPA autoscaling |
| `[ ]` | Nix flake dev shell | **Nix** | Reproducible env: Python + Rust + Zig + ASM — identical on every machine |
| `[ ]` | Cross-compile native extensions to musl | **Zig** (built-in cross-compile) | Single static binary — no libc dependency on Alpine containers |
| `[ ]` | CI matrix: Python 3.11–3.13 × Linux/macOS/Win | **GitHub Actions** | Catch platform-specific Cython / C ABI regressions early |
| `[ ]` | Reproducible perf benchmarks in CI | **Python** + pytest-benchmark | Block merge if any benchmark regresses more than 10% |

---


## License

MIT — Built by [Brashkie / Hepein Oficial](https://github.com/Brashkie)

> Performance is a feature. DataHarvest uses native code where it matters — with safe Python fallbacks everywhere.
