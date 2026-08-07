"""DataHarvest — Monitor & AI Celery Tasks"""
from __future__ import annotations
from ..core.celery_app import celery
from loguru import logger


@celery.task(name="app.tasks.monitor_tasks.collect_system_metrics")
def collect_system_metrics():
    import psutil, time
    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory().percent
    logger.debug(f"System metrics: cpu={cpu}% mem={mem}%")
    return {"cpu": cpu, "memory": mem, "ts": time.time()}


@celery.task(name="app.tasks.monitor_tasks.cleanup_stale_jobs")
def cleanup_stale_jobs():
    logger.debug("Cleaning stale jobs...")
    return {"cleaned": 0}


@celery.task(name="app.tasks.monitor_tasks.rotate_logs")
def rotate_logs():
    logger.debug("Log rotation triggered")
    return {"rotated": True}