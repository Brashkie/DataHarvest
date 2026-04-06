"""
DataHarvest — Celery Worker Configuration
Background tasks: scraping, pipelines, ML, exports
"""
from __future__ import annotations

from celery import Celery
from celery.signals import worker_ready, task_prerun, task_postrun, task_failure
from loguru import logger
import os


def make_celery(app=None) -> Celery:
    """Create Celery instance. Works standalone or with Flask app."""

    broker = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/1")
    backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

    celery_app = Celery(
        "dataharvest",
        broker=broker,
        backend=backend,
        include=[
            "app.tasks.scraper_tasks",
            "app.tasks.pipeline_tasks",
            "app.tasks.analytics_tasks",
            "app.tasks.ai_tasks",
            "app.tasks.export_tasks",
            "app.tasks.monitor_tasks",
        ],
    )

    # ── Configuration ─────────────────────────────────────────────────────
    celery_app.conf.update(
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_soft_time_limit=600,
        task_time_limit=900,
        worker_prefetch_multiplier=1,
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        result_expires=86400,         # 24h
        task_compression="gzip",
        result_compression="gzip",
        worker_send_task_events=True,
        task_send_sent_event=True,
    )

    # ── Beat Schedule (periodic tasks) ────────────────────────────────────
    celery_app.conf.beat_schedule = {
        # Monitor system health every 30s
        "monitor-health": {
            "task": "app.tasks.monitor_tasks.collect_system_metrics",
            "schedule": 30.0,
            "options": {"queue": "monitoring"},
        },
        # Clean stale jobs every 5 minutes
        "cleanup-stale-jobs": {
            "task": "app.tasks.monitor_tasks.cleanup_stale_jobs",
            "schedule": 300.0,
            "options": {"queue": "maintenance"},
        },
        # Rotate logs daily
        "rotate-logs": {
            "task": "app.tasks.monitor_tasks.rotate_logs",
            "schedule": 86400.0,
            "options": {"queue": "maintenance"},
        },
    }

    # ── Queue Routing ─────────────────────────────────────────────────────
    celery_app.conf.task_routes = {
        "app.tasks.scraper_tasks.*":   {"queue": "scraping"},
        "app.tasks.pipeline_tasks.*":  {"queue": "pipelines"},
        "app.tasks.analytics_tasks.*": {"queue": "analytics"},
        "app.tasks.ai_tasks.*":        {"queue": "ai"},
        "app.tasks.export_tasks.*":    {"queue": "exports"},
        "app.tasks.monitor_tasks.*":   {"queue": "monitoring"},
    }

    # ── Priority Queues ───────────────────────────────────────────────────
    celery_app.conf.task_queue_max_priority = 10
    celery_app.conf.task_default_priority = 5

    if app is not None:
        # Bind to Flask app context
        class ContextTask(celery_app.Task):
            def __call__(self, *args, **kwargs):
                with app.app_context():
                    return self.run(*args, **kwargs)

        celery_app.Task = ContextTask

    return celery_app


# ── Signals ───────────────────────────────────────────────────────────────────

@worker_ready.connect
def on_worker_ready(sender, **kwargs):
    logger.info("🌿 Celery worker ready — DataHarvest tasks loaded")


@task_prerun.connect
def on_task_start(task_id, task, args, kwargs, **extra):
    logger.debug(f"▶ Task started: {task.name} [{task_id[:8]}]")


@task_postrun.connect
def on_task_done(task_id, task, args, kwargs, retval, state, **extra):
    logger.debug(f"✓ Task completed: {task.name} [{task_id[:8]}] → {state}")


@task_failure.connect
def on_task_fail(task_id, exception, traceback, sender, **kwargs):
    logger.error(f"✗ Task failed: {sender.name} [{task_id[:8]}] — {exception}")


# Module-level singleton (for standalone workers)
celery = make_celery()