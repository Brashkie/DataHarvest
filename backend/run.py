"""
DataHarvest — Application Entry Point
Usage:
    python run.py                     # dev server
    python run.py --env production    # prod (use gunicorn instead)
    celery -A run.celery worker -Q scraping,pipelines,analytics,ai,exports -c 4 --loglevel=info
    celery -A run.celery beat --loglevel=info
    celery -A run.celery flower --port=5555
"""
import os
import sys
import argparse

from app import create_app, socketio
from app.core.celery_app import make_celery

# ── Parse args ────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="DataHarvest Backend")
parser.add_argument("--env", default=os.environ.get("APP_ENV", "development"),
                    choices=["development", "production", "testing"])
parser.add_argument("--host", default="0.0.0.0")
parser.add_argument("--port", type=int, default=5000)
parser.add_argument("--debug", action="store_true")
args, _ = parser.parse_known_args()

# ── Create App ────────────────────────────────────────────────────────────────
app = create_app(args.env)

# ── Celery (importable as run.celery for workers) ─────────────────────────────
celery = make_celery(app)

if __name__ == "__main__":
    host = args.host or app.config.get("APP_HOST", "0.0.0.0")
    port = args.port or app.config.get("APP_PORT", 5000)
    debug = args.debug or app.config.get("DEBUG", False)

    print(f"""
╔══════════════════════════════════════════════════════╗
║          DataHarvest API v2.0  —  Backend            ║
╠══════════════════════════════════════════════════════╣
║  API:        http://{host}:{port}/api/v1              
║  Docs:       http://{host}:{port}/api/docs/           
║  Health:     http://{host}:{port}/api/v1/health/      
║  Env:        {args.env:<20}                           
╚══════════════════════════════════════════════════════╝
    """)

    socketio.run(
        app,
        host=host,
        port=port,
        debug=debug,
        use_reloader=debug,
        log_output=False,
        allow_unsafe_werkzeug=True,
    )