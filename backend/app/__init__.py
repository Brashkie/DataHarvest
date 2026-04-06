"""
DataHarvest Backend — App Factory
Flask + SocketIO + Celery + Redis + SQLAlchemy
"""
# __init__.py
from __future__ import annotations

import os
from typing import Optional

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from loguru import logger
from flasgger import Swagger

# ── Extension singletons (imported by modules) ──────────────────────────────
socketio = SocketIO()
cache = Cache()
limiter = Limiter(key_func=get_remote_address)

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/api/v1/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs/",
    "title": "DataHarvest API",
    "version": "2.0.0",
    "description": "Professional Data Harvesting, Scraping & Analytics Platform",
    "termsOfService": "",
    "contact": {"email": "api@dataharvest.io"},
    "basePath": "/api/v1",
}


def create_app(config_name: Optional[str] = None) -> Flask:
    """Application factory — creates and configures the Flask app."""

    app = Flask(__name__, instance_relative_config=True)

    # ── Configuration ────────────────────────────────────────────────────────
    _load_config(app, config_name)

    # ── Ensure directories exist ─────────────────────────────────────────────
    for directory in [
        app.config.get("EXPORT_DIR", "./exports"),
        app.config.get("DATA_DIR", "./data"),
        app.config.get("LOGS_DIR", "./logs"),
        app.config.get("UPLOADS_DIR", "./data/uploads"),
        "./data/models",
    ]:
        os.makedirs(directory, exist_ok=True)

    # ── Logging ──────────────────────────────────────────────────────────────
    _configure_logging(app)

    # ── Extensions ───────────────────────────────────────────────────────────
    _init_extensions(app)

    # ── Blueprints ───────────────────────────────────────────────────────────
    _register_blueprints(app)

    # ── SocketIO Events ──────────────────────────────────────────────────────
    _register_socketio_events()

    # ── Shell Context ────────────────────────────────────────────────────────
    @app.shell_context_processor
    def make_shell_context():
        return {"app": app, "db": _get_db()}

    logger.info(
        f"🚀 DataHarvest API started | env={app.config['APP_ENV']} | "
        f"port={app.config.get('APP_PORT', 5000)}"
    )

    return app


# ── Private helpers ──────────────────────────────────────────────────────────

def _load_config(app: Flask, config_name: Optional[str]) -> None:
    """Load configuration from environment and optional config class."""
    from .core.config import config_map, BaseConfig

    env = config_name or os.environ.get("APP_ENV", "development")
    cfg_class = config_map.get(env, config_map["development"])
    app.config.from_object(cfg_class)

    # Override from .env file if present
    if os.path.exists(".env"):
        from dotenv import load_dotenv
        load_dotenv(override=True)

    # Apply env vars that override config
    for key in [
        "DATABASE_URL", "REDIS_URL", "MONGODB_URL",
        "SECRET_KEY", "CELERY_BROKER_URL", "CELERY_RESULT_BACKEND",
    ]:
        if val := os.environ.get(key):
            app.config[key] = val


def _configure_logging(app: Flask) -> None:
    """Configure Loguru for structured logging."""
    import sys

    log_level = app.config.get("LOG_LEVEL", "INFO")
    log_dir = app.config.get("LOGS_DIR", "./logs")

    logger.remove()
    logger.add(sys.stdout, level=log_level, colorize=True,
               format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>")
    logger.add(
        f"{log_dir}/dataharvest.log",
        level="DEBUG",
        rotation="50 MB",
        retention="30 days",
        compression="zip",
        serialize=False,
    )
    logger.add(
        f"{log_dir}/errors.log",
        level="ERROR",
        rotation="10 MB",
        retention="60 days",
        serialize=True,
    )


def _init_extensions(app: Flask) -> None:
    """Initialize all Flask extensions."""

    # CORS
    CORS(
        app,
        origins=app.config.get("CORS_ORIGINS", "*").split(","),
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # SocketIO
    socketio.init_app(
        app,
        cors_allowed_origins="*",
        async_mode=app.config.get("SOCKETIO_ASYNC_MODE", "threading"),
        ping_interval=app.config.get("SOCKETIO_PING_INTERVAL", 25),
        ping_timeout=app.config.get("SOCKETIO_PING_TIMEOUT", 60),
        logger=False,
        engineio_logger=False,
        message_queue=app.config.get("REDIS_URL"),
    )

    # Cache
    cache.init_app(app, config={
        "CACHE_TYPE": app.config.get("CACHE_TYPE", "RedisCache"),
        "CACHE_REDIS_URL": app.config.get("REDIS_URL", "redis://localhost:6379/0"),
        "CACHE_DEFAULT_TIMEOUT": app.config.get("CACHE_DEFAULT_TIMEOUT", 300),
        "CACHE_KEY_PREFIX": app.config.get("CACHE_KEY_PREFIX", "dh:"),
    })

    # Rate Limiter
    limiter.init_app(app)

    # Swagger / OpenAPI
    Swagger(app, config=SWAGGER_CONFIG, merge=True)

    # SQLAlchemy
    try:
        from .core.database import db
        db.init_app(app)
        with app.app_context():
            db.create_all()
        logger.info("✅ PostgreSQL connected")
    except Exception as e:
        logger.warning(f"⚠️  PostgreSQL unavailable: {e}")


def _register_blueprints(app: Flask) -> None:
    """Register all API blueprints."""
    from .api.health import health_bp
    from .api.scraper import scraper_bp
    from .api.pipelines import pipelines_bp
    from .api.analytics import analytics_bp
    from .api.tables import tables_bp
    from .api.ai import ai_bp
    from .api.exports import exports_bp
    from .api.monitor import monitor_bp
    from .api.auth import auth_bp

    blueprints = [
        (health_bp,    "/api/v1/health"),
        (auth_bp,      "/api/v1/auth"),
        (scraper_bp,   "/api/v1/scraper"),
        (pipelines_bp, "/api/v1/pipelines"),
        (analytics_bp, "/api/v1/analytics"),
        (tables_bp,    "/api/v1/tables"),
        (ai_bp,        "/api/v1/ai"),
        (exports_bp,   "/api/v1/exports"),
        (monitor_bp,   "/api/v1/monitor"),
    ]

    for bp, prefix in blueprints:
        app.register_blueprint(bp, url_prefix=prefix)
        logger.debug(f"  📌 Blueprint registered: {prefix}")


def _register_socketio_events() -> None:
    """Register SocketIO event handlers."""
    from .core import socket_events  # noqa: F401 — registers handlers as side effect


def _get_db():
    try:
        from .core.database import db
        return db
    except Exception:
        return None