"""
DataHarvest — Celery Worker Entry Point
Run with: python worker.py
Or directly: celery -A worker.celery worker --loglevel=info -Q scraping,pipelines,analytics,ai,exports,monitoring
"""
import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.core.celery_app import make_celery

flask_app = create_app(os.environ.get("APP_ENV", "development"))
celery = make_celery(flask_app)

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════╗
║       DataHarvest Celery Worker  v2.0.0              ║
║──────────────────────────────────────────────────────║
║  Queues: scraping, pipelines, analytics, ai,         ║
║          exports, monitoring, maintenance            ║
║  Broker: Redis                                       ║
╚══════════════════════════════════════════════════════╝
    """)
    celery.worker_main([
        "worker",
        "--loglevel=info",
        "--queues=scraping,pipelines,analytics,ai,exports,monitoring,maintenance",
        "--concurrency=4",
        "--pool=prefork",
    ])