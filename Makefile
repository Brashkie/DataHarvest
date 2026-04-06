# DataHarvest — Developer Makefile

.PHONY: help install dev backend frontend worker beat flower docker test lint

help:
	@echo ""
	@echo "  DataHarvest v2.0 — Commands"
	@echo "  ─────────────────────────────────────────────────"
	@echo "  make install      Install all deps (backend + frontend)"
	@echo "  make dev          Start full dev stack (tmux)"
	@echo "  make backend      Start Flask API only"
	@echo "  make frontend     Start Vite dev server only"
	@echo "  make worker       Start Celery worker (all queues)"
	@echo "  make beat         Start Celery beat scheduler"
	@echo "  make flower       Start Flower UI (localhost:5555)"
	@echo "  make docker       Start full stack with Docker Compose"
	@echo "  make test         Run backend tests"
	@echo "  make lint         Lint & format Python code"
	@echo "  make playwright   Install Playwright browsers"
	@echo ""

install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing Playwright browsers..."
	cd backend && playwright install chromium firefox

backend:
	@echo "Starting Flask API on http://localhost:5000"
	cd backend && python run.py --env development --debug

frontend:
	@echo "Starting Vite on http://localhost:5173"
	cd frontend && npm run dev

worker:
	@echo "Starting Celery worker (all queues)..."
	cd backend && celery -A run.celery worker \
		-Q scraping,pipelines,analytics,ai,exports,monitoring,maintenance \
		-c 4 --loglevel=info

beat:
	@echo "Starting Celery beat scheduler..."
	cd backend && celery -A run.celery beat --loglevel=info

flower:
	@echo "Starting Flower UI on http://localhost:5555"
	cd backend && celery -A run.celery flower --port=5555

docker:
	@echo "Starting full stack with Docker Compose..."
	docker compose up --build -d
	@echo "Services started. API: http://localhost:5000 | Frontend: http://localhost"

docker-down:
	docker compose down

playwright:
	cd backend && playwright install chromium firefox webkit

test:
	cd backend && pytest tests/ -v --cov=app --cov-report=term-missing

lint:
	cd backend && black app/ && ruff check app/ --fix && mypy app/ --ignore-missing-imports

migrate:
	cd backend && flask db upgrade

seed:
	cd backend && python scripts/seed_demo_data.py

logs:
	tail -f backend/logs/dataharvest.log

redis-cli:
	redis-cli

# ── Aliases ───────────────────────────────────────────────────────────────────
api: backend
fe: frontend