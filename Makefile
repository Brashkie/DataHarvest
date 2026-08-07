# DataHarvest — Developer Makefile
# Linux/macOS only (no `make` on Windows by default) — see `node scripts/cli.js help` there.

.PHONY: help install dev backend frontend worker beat ratelimiter flower docker test lint

help:
	@echo ""
	@echo "  DataHarvest v3.0 — Commands"
	@echo "  ─────────────────────────────────────────────────"
	@echo "  make install      Install all deps (backend + frontend, creates .venv if missing)"
	@echo "  make dev          Start full dev stack (tmux)"
	@echo "  make backend      Start Flask API only"
	@echo "  make frontend     Start Vite dev server only"
	@echo "  make worker       Start Celery worker (all queues)"
	@echo "  make beat         Start Celery beat scheduler"
	@echo "  make ratelimiter  Start the Rust rate-limiter/dedup sidecar (localhost:8090)"
	@echo "  make flower       Start Flower UI (localhost:5555)"
	@echo "  make docker       Start full stack with Docker Compose"
	@echo "  make test         Run backend tests"
	@echo "  make lint         Lint & format Python code"
	@echo "  make playwright   Install Playwright browsers"
	@echo ""

install:
	@echo "Installing backend dependencies..."
	[ -d .venv ] || python3 -m venv .venv
	.venv/bin/pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	npm install
	@echo "Installing Playwright browsers..."
	.venv/bin/playwright install chromium firefox

backend:
	@echo "Starting Flask API on http://localhost:5050"
	.venv/bin/python run.py --env development --debug

frontend:
	@echo "Starting Vite on http://localhost:3000"
	npm run dev:frontend

worker:
	@echo "Starting Celery worker (all queues)..."
	.venv/bin/celery -A run.celery worker \
		-Q scraping,pipelines,analytics,ai,exports,monitoring,maintenance \
		-c 4 --loglevel=info

beat:
	@echo "Starting Celery beat scheduler..."
	.venv/bin/celery -A run.celery beat --loglevel=info

ratelimiter:
	@echo "Starting rate-limiter/dedup sidecar on http://localhost:8090"
	cd ratelimiter && cargo run --quiet

flower:
	@echo "Starting Flower UI on http://localhost:5555"
	.venv/bin/celery -A run.celery flower --port=5555

docker:
	@echo "Starting full stack with Docker Compose..."
	docker compose up --build -d
	@echo "Services started. API: http://localhost:5050 | Frontend: http://localhost"

docker-down:
	docker compose down

playwright:
	.venv/bin/playwright install chromium firefox webkit

test:
	.venv/bin/pytest tests/ -v --cov=app --cov-report=term-missing

lint:
	.venv/bin/black app/ && .venv/bin/ruff check app/ --fix && .venv/bin/mypy app/ --ignore-missing-imports

migrate:
	.venv/bin/flask db upgrade

seed:
	.venv/bin/python scripts/seed_demo_data.py

logs:
	tail -f logs/dataharvest.log

redis-cli:
	redis-cli

# ── Aliases ───────────────────────────────────────────────────────────────────
api: backend
fe: frontend
