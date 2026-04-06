"""
DataHarvest — Database Models & SQLAlchemy Setup
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    Text, JSON, ForeignKey, Enum as SAEnum, Index, BigInteger
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
import enum

db = SQLAlchemy()


# ── Helpers ──────────────────────────────────────────────────────────────────

def gen_uuid() -> str:
    return str(uuid.uuid4())


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# ── Enums ────────────────────────────────────────────────────────────────────

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class ScraperEngine(str, enum.Enum):
    PLAYWRIGHT = "playwright"
    SELENIUM = "selenium"
    REQUESTS = "requests"
    SCRAPY = "scrapy"
    CLOUDSCRAPER = "cloudscraper"


class PipelineStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


# ── Models ───────────────────────────────────────────────────────────────────

class ScraperJob(db.Model, TimestampMixin):
    """A scraping job — URL, engine, config, results."""
    __tablename__ = "scraper_jobs"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    name        = Column(String(255), nullable=False)
    url         = Column(Text, nullable=False)
    engine      = Column(SAEnum(ScraperEngine), default=ScraperEngine.PLAYWRIGHT, nullable=False)
    status      = Column(SAEnum(JobStatus), default=JobStatus.PENDING, nullable=False)
    config      = Column(JSON, default=dict)          # JS selectors, headers, auth, etc.
    schedule    = Column(String(100))                 # cron expression
    celery_task_id = Column(String(255))
    progress    = Column(Integer, default=0)
    pages_scraped = Column(Integer, default=0)
    rows_extracted = Column(Integer, default=0)
    error_message  = Column(Text)
    started_at     = Column(DateTime)
    completed_at   = Column(DateTime)
    duration_secs  = Column(Float)
    result_table   = Column(String(255))              # table name in results DB
    tags           = Column(JSON, default=list)
    profile_id     = Column(String(36), ForeignKey("scraper_profiles.id"))
    pipeline_id    = Column(String(36), ForeignKey("pipelines.id"))

    profile  = relationship("ScraperProfile", back_populates="jobs")
    pipeline = relationship("Pipeline", back_populates="scraper_jobs")
    logs     = relationship("JobLog", back_populates="scraper_job", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_scraper_jobs_status", "status"),
        Index("ix_scraper_jobs_created", "created_at"),
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "url": self.url,
            "engine": self.engine.value if self.engine else None,
            "status": self.status.value if self.status else None,
            "config": self.config,
            "progress": self.progress,
            "pages_scraped": self.pages_scraped,
            "rows_extracted": self.rows_extracted,
            "celery_task_id": self.celery_task_id,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_secs": self.duration_secs,
            "tags": self.tags or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ScraperProfile(db.Model, TimestampMixin):
    """Reusable scraper configuration profile."""
    __tablename__ = "scraper_profiles"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    name        = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    engine      = Column(SAEnum(ScraperEngine), default=ScraperEngine.PLAYWRIGHT)
    config      = Column(JSON, default=dict)
    selectors   = Column(JSON, default=dict)         # CSS/XPath selectors map
    headers     = Column(JSON, default=dict)
    cookies     = Column(JSON, default=dict)
    auth_config = Column(JSON, default=dict)          # login flow, tokens
    proxy_config = Column(JSON, default=dict)
    rate_limit  = Column(Integer, default=1)          # req/sec
    is_public   = Column(Boolean, default=False)

    jobs = relationship("ScraperJob", back_populates="profile")


class Pipeline(db.Model, TimestampMixin):
    """ETL/data pipeline definition."""
    __tablename__ = "pipelines"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    name        = Column(String(255), nullable=False)
    description = Column(Text)
    status      = Column(SAEnum(PipelineStatus), default=PipelineStatus.DRAFT)
    definition  = Column(JSON, default=dict)    # ReactFlow nodes+edges
    schedule    = Column(String(100))
    last_run_at = Column(DateTime)
    next_run_at = Column(DateTime)
    run_count   = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    fail_count  = Column(Integer, default=0)
    avg_duration_secs = Column(Float)
    tags        = Column(JSON, default=list)
    celery_task_id = Column(String(255))

    scraper_jobs = relationship("ScraperJob", back_populates="pipeline")
    runs = relationship("PipelineRun", back_populates="pipeline", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
            "definition": self.definition,
            "schedule": self.schedule,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "run_count": self.run_count,
            "success_count": self.success_count,
            "fail_count": self.fail_count,
            "avg_duration_secs": self.avg_duration_secs,
            "tags": self.tags or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PipelineRun(db.Model, TimestampMixin):
    """Individual pipeline execution record."""
    __tablename__ = "pipeline_runs"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    pipeline_id = Column(String(36), ForeignKey("pipelines.id"), nullable=False)
    status      = Column(SAEnum(JobStatus), default=JobStatus.PENDING)
    celery_task_id = Column(String(255))
    started_at  = Column(DateTime)
    completed_at = Column(DateTime)
    duration_secs = Column(Float)
    rows_in     = Column(BigInteger, default=0)
    rows_out    = Column(BigInteger, default=0)
    bytes_processed = Column(BigInteger, default=0)
    error_message = Column(Text)
    node_results = Column(JSON, default=dict)     # per-node execution results
    metrics     = Column(JSON, default=dict)

    pipeline = relationship("Pipeline", back_populates="runs")

    __table_args__ = (
        Index("ix_pipeline_runs_pipeline_id", "pipeline_id"),
        Index("ix_pipeline_runs_status", "status"),
    )


class Dataset(db.Model, TimestampMixin):
    """Metadata for a stored dataset."""
    __tablename__ = "datasets"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    name        = Column(String(255), nullable=False)
    description = Column(Text)
    source      = Column(String(255))           # URL, pipeline_id, upload, etc.
    source_type = Column(String(50))            # scraper | pipeline | upload | bigquery | api
    storage_path = Column(String(512))          # local path or cloud URI
    storage_format = Column(String(20), default="parquet")  # parquet | csv | json | xlsx
    row_count   = Column(BigInteger, default=0)
    column_count = Column(Integer, default=0)
    size_bytes  = Column(BigInteger, default=0)
    schema_info = Column(JSON, default=dict)    # column names, types, stats
    tags        = Column(JSON, default=list)
    is_public   = Column(Boolean, default=False)
    last_accessed_at = Column(DateTime)
    access_count = Column(Integer, default=0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "source": self.source,
            "source_type": self.source_type,
            "storage_path": self.storage_path,
            "storage_format": self.storage_format,
            "row_count": self.row_count,
            "column_count": self.column_count,
            "size_bytes": self.size_bytes,
            "schema_info": self.schema_info,
            "tags": self.tags or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MLModel(db.Model, TimestampMixin):
    """Trained ML model registry."""
    __tablename__ = "ml_models"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    name        = Column(String(255), nullable=False)
    version     = Column(String(50), default="1.0.0")
    model_type  = Column(String(100))           # classification | regression | clustering | anomaly
    algorithm   = Column(String(100))           # RandomForest | XGBoost | LSTM | etc.
    dataset_id  = Column(String(36), ForeignKey("datasets.id"))
    target_column = Column(String(255))
    feature_columns = Column(JSON, default=list)
    metrics     = Column(JSON, default=dict)    # accuracy, f1, rmse, etc.
    hyperparams = Column(JSON, default=dict)
    artifact_path = Column(String(512))
    mlflow_run_id = Column(String(255))
    is_deployed = Column(Boolean, default=False)
    prediction_count = Column(BigInteger, default=0)

    dataset = relationship("Dataset")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "model_type": self.model_type,
            "algorithm": self.algorithm,
            "metrics": self.metrics,
            "is_deployed": self.is_deployed,
            "prediction_count": self.prediction_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class JobLog(db.Model):
    """Real-time logs for scraper jobs."""
    __tablename__ = "job_logs"

    id              = Column(BigInteger, primary_key=True, autoincrement=True)
    scraper_job_id  = Column(String(36), ForeignKey("scraper_jobs.id"), nullable=False)
    level           = Column(String(10), default="INFO")   # DEBUG INFO WARNING ERROR
    message         = Column(Text, nullable=False)
    details         = Column(JSON)
    timestamp       = Column(DateTime, default=datetime.utcnow, nullable=False)

    scraper_job = relationship("ScraperJob", back_populates="logs")

    __table_args__ = (
        Index("ix_job_logs_scraper_job_id", "scraper_job_id"),
        Index("ix_job_logs_timestamp", "timestamp"),
    )


class ExportJob(db.Model, TimestampMixin):
    """Export task record."""
    __tablename__ = "export_jobs"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    dataset_id  = Column(String(36), ForeignKey("datasets.id"))
    format      = Column(String(20))            # csv | xlsx | json | parquet | pdf | docx
    status      = Column(SAEnum(JobStatus), default=JobStatus.PENDING)
    file_path   = Column(String(512))
    file_size_bytes = Column(BigInteger)
    download_url = Column(String(512))
    expires_at  = Column(DateTime)
    config      = Column(JSON, default=dict)
    celery_task_id = Column(String(255))

    dataset = relationship("Dataset")