"""
DataHarvest — Configuration Management
Pydantic Settings + Flask config classes
"""
from __future__ import annotations

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Pydantic settings — reads from env / .env file."""

    # App
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "dev-secret-change-in-prod"
    APP_DEBUG: bool = True
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 5000
    CORS_ORIGINS: str = "http://localhost:5173"

    # Database
    DATABASE_URL: str = "sqlite:///./dataharvest.db"
    MONGODB_URL: str = "mongodb://localhost:27017/dataharvest"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    CELERY_WORKER_CONCURRENCY: int = 4

    # Scraping
    PLAYWRIGHT_HEADLESS: bool = True
    PLAYWRIGHT_TIMEOUT: int = 30000
    SELENIUM_HEADLESS: bool = True
    DEFAULT_USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/127.0.0.0 Safari/537.36"
    )
    REQUEST_TIMEOUT: int = 30
    REQUEST_RETRIES: int = 3
    MAX_CONCURRENT_SCRAPERS: int = 10
    USE_TOR: bool = False

    # Storage
    EXPORT_DIR: str = "./exports"
    DATA_DIR: str = "./data"
    LOGS_DIR: str = "./logs"
    UPLOADS_DIR: str = "./data/uploads"
    MAX_UPLOAD_SIZE_MB: int = 500

    # Cache
    CACHE_TYPE: str = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT: int = 300
    CACHE_KEY_PREFIX: str = "dh:"

    # AI
    OPENAI_API_KEY: Optional[str] = None
    HUGGINGFACE_TOKEN: Optional[str] = None
    MLFLOW_TRACKING_URI: str = "http://localhost:5001"
    MODEL_CACHE_DIR: str = "./data/models"

    # Security
    JWT_SECRET_KEY: str = "dev-jwt-secret"
    JWT_ACCESS_TOKEN_EXPIRES: int = 3600

    # Monitoring
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = True

    # SocketIO
    SOCKETIO_ASYNC_MODE: str = "threading"
    SOCKETIO_PING_INTERVAL: int = 25
    SOCKETIO_PING_TIMEOUT: int = 60

    # Cloud
    GCP_PROJECT_ID: Optional[str] = None
    GCP_CREDENTIALS_PATH: Optional[str] = None
    BIGQUERY_DATASET: str = "dataharvest_raw"

    @field_validator("CORS_ORIGINS")
    @classmethod
    def parse_cors(cls, v: str) -> str:
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


# ── Flask Config Classes ─────────────────────────────────────────────────────

class BaseConfig:
    settings = Settings()

    SECRET_KEY = settings.APP_SECRET_KEY
    APP_ENV = settings.APP_ENV
    DEBUG = False
    TESTING = False

    # Database
    SQLALCHEMY_DATABASE_URI = settings.DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 10,
        "max_overflow": 20,
    }

    # MongoDB
    MONGODB_URL = settings.MONGODB_URL

    # Redis
    REDIS_URL = settings.REDIS_URL

    # Celery
    CELERY_BROKER_URL = settings.CELERY_BROKER_URL
    CELERY_RESULT_BACKEND = settings.CELERY_RESULT_BACKEND
    CELERY_TASK_SERIALIZER = "json"
    CELERY_RESULT_SERIALIZER = "json"
    CELERY_ACCEPT_CONTENT = ["json"]
    CELERY_TIMEZONE = "UTC"
    CELERY_ENABLE_UTC = True
    CELERY_WORKER_CONCURRENCY = settings.CELERY_WORKER_CONCURRENCY
    CELERY_TASK_TRACK_STARTED = True
    CELERY_TASK_SOFT_TIME_LIMIT = 600
    CELERY_TASK_TIME_LIMIT = 900

    # Cache
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = settings.REDIS_URL
    CACHE_DEFAULT_TIMEOUT = settings.CACHE_DEFAULT_TIMEOUT
    CACHE_KEY_PREFIX = settings.CACHE_KEY_PREFIX

    # CORS
    CORS_ORIGINS = settings.CORS_ORIGINS

    # Storage
    EXPORT_DIR = settings.EXPORT_DIR
    DATA_DIR = settings.DATA_DIR
    LOGS_DIR = settings.LOGS_DIR
    UPLOADS_DIR = settings.UPLOADS_DIR
    MAX_CONTENT_LENGTH = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    # Scraping
    PLAYWRIGHT_HEADLESS = settings.PLAYWRIGHT_HEADLESS
    PLAYWRIGHT_TIMEOUT = settings.PLAYWRIGHT_TIMEOUT
    SELENIUM_HEADLESS = settings.SELENIUM_HEADLESS
    DEFAULT_USER_AGENT = settings.DEFAULT_USER_AGENT
    REQUEST_TIMEOUT = settings.REQUEST_TIMEOUT
    REQUEST_RETRIES = settings.REQUEST_RETRIES
    MAX_CONCURRENT_SCRAPERS = settings.MAX_CONCURRENT_SCRAPERS
    USE_TOR = settings.USE_TOR

    # AI
    OPENAI_API_KEY = settings.OPENAI_API_KEY
    MLFLOW_TRACKING_URI = settings.MLFLOW_TRACKING_URI
    MODEL_CACHE_DIR = settings.MODEL_CACHE_DIR

    # Security
    JWT_SECRET_KEY = settings.JWT_SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = settings.JWT_ACCESS_TOKEN_EXPIRES

    # Monitoring
    LOG_LEVEL = settings.LOG_LEVEL
    ENABLE_METRICS = settings.ENABLE_METRICS

    # SocketIO
    SOCKETIO_ASYNC_MODE = settings.SOCKETIO_ASYNC_MODE
    SOCKETIO_PING_INTERVAL = settings.SOCKETIO_PING_INTERVAL
    SOCKETIO_PING_TIMEOUT = settings.SOCKETIO_PING_TIMEOUT

    # Cloud
    GCP_PROJECT_ID = settings.GCP_PROJECT_ID
    BIGQUERY_DATASET = settings.BIGQUERY_DATASET


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    APP_ENV = "development"
    CACHE_TYPE = "SimpleCache"  # No Redis needed for dev
    LOG_LEVEL = "DEBUG"
    SQLALCHEMY_ECHO = False


class ProductionConfig(BaseConfig):
    DEBUG = False
    APP_ENV = "production"
    LOG_LEVEL = "WARNING"
    SQLALCHEMY_ENGINE_OPTIONS = {
        **BaseConfig.SQLALCHEMY_ENGINE_OPTIONS,
        "pool_size": 20,
        "max_overflow": 40,
    }


class TestingConfig(BaseConfig):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    CELERY_TASK_ALWAYS_EAGER = True
    CACHE_TYPE = "SimpleCache"
    WTF_CSRF_ENABLED = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}

# Convenience singleton
settings = Settings()