"""
DataHarvest — Celery Scraper Tasks
Background scraping with real-time WebSocket progress updates
"""
from __future__ import annotations

import time
from typing import Any, Dict, Optional

from celery import shared_task, current_task
from loguru import logger

from ..core.celery_app import celery
from ..scrapers.engines.scraper_engine import ScrapeConfig, scrape


def _emit_progress(job_id: str, data: Dict) -> None:
    """Emit WebSocket progress event."""
    try:
        from ... import socketio
        socketio.emit("job:progress", {"job_id": job_id, **data}, namespace="/")
    except Exception as e:
        logger.debug(f"WS emit failed (non-critical): {e}")


def _update_db_job(job_id: str, updates: Dict) -> None:
    """Update scraper job in database."""
    try:
        from ..core.database import db, ScraperJob, JobStatus, JobLog
        from flask import current_app
        job = ScraperJob.query.get(job_id)
        if job:
            for k, v in updates.items():
                if hasattr(job, k):
                    setattr(job, k, v)
            db.session.commit()
    except Exception as e:
        logger.debug(f"DB update skipped: {e}")


@celery.task(bind=True, name="app.tasks.scraper_tasks.run_scraper_job", max_retries=2)
def run_scraper_job(self, job_id: str, config_dict: Dict) -> Dict[str, Any]:
    """
    Main scraper task.
    - Runs with the configured engine (playwright/selenium/requests/auto)
    - Streams progress via SocketIO
    - Saves results to DB/file
    """
    start = time.time()
    task_id = self.request.id

    logger.info(f"🕷 Starting scraper job [{job_id}] with task [{task_id[:8]}]")

    # Mark as running
    _update_db_job(job_id, {
        "status": "running",
        "celery_task_id": task_id,
        "started_at": __import__("datetime").datetime.utcnow(),
    })
    _emit_progress(job_id, {"status": "running", "progress": 5, "stage": "initializing"})

    try:
        # Build config
        config = ScrapeConfig(**config_dict)

        def on_progress(data: Dict) -> None:
            _emit_progress(job_id, data)
            # Update Celery task state for Flower monitoring
            self.update_state(state="PROGRESS", meta=data)

        _emit_progress(job_id, {"progress": 15, "stage": "launching_browser"})

        # Execute scrape
        result = scrape(config, on_progress=on_progress)

        # Persist results
        if result.success:
            output_path = _save_results(job_id, result)
            _emit_progress(job_id, {"progress": 90, "stage": "saving_results"})

            _update_db_job(job_id, {
                "status": "completed",
                "progress": 100,
                "pages_scraped": result.pages_scraped,
                "rows_extracted": result.rows_extracted,
                "duration_secs": result.duration_secs,
                "result_table": output_path,
                "completed_at": __import__("datetime").datetime.utcnow(),
            })
            _emit_progress(job_id, {
                "status": "completed",
                "progress": 100,
                "stage": "done",
                "rows_extracted": result.rows_extracted,
                "pages_scraped": result.pages_scraped,
                "duration_secs": result.duration_secs,
                "output_path": output_path,
            })

            logger.info(
                f"✅ Job [{job_id}] done — "
                f"{result.rows_extracted} rows, {result.pages_scraped} pages, "
                f"{result.duration_secs:.1f}s"
            )
            return {
                "success": True,
                "job_id": job_id,
                "rows_extracted": result.rows_extracted,
                "pages_scraped": result.pages_scraped,
                "duration_secs": result.duration_secs,
                "output_path": output_path,
            }
        else:
            raise RuntimeError(result.error or "Scrape returned no data")

    except Exception as exc:
        logger.error(f"✗ Scraper job [{job_id}] failed: {exc}")
        _update_db_job(job_id, {
            "status": "failed",
            "error_message": str(exc),
            "completed_at": __import__("datetime").datetime.utcnow(),
        })
        _emit_progress(job_id, {
            "status": "error",
            "progress": 100,
            "stage": "error",
            "error": str(exc),
        })
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 10)


def _save_results(job_id: str, result) -> str:
    """Save scrape results to Parquet file."""
    import pandas as pd
    import os

    output_dir = "./data/scraped"
    os.makedirs(output_dir, exist_ok=True)

    all_rows = []

    # Flat data from selectors
    if result.data:
        all_rows.extend(result.data)

    # Table rows
    if result.tables:
        for table in result.tables:
            all_rows.extend(table.get("rows", []))

    if all_rows:
        df = pd.DataFrame(all_rows)
        output_path = f"{output_dir}/{job_id}.parquet"
        df.to_parquet(output_path, index=False)
        logger.debug(f"Saved {len(df)} rows → {output_path}")
        return output_path

    return ""


@celery.task(bind=True, name="app.tasks.scraper_tasks.run_bulk_scraper")
def run_bulk_scraper(self, job_ids: list, configs: list) -> Dict:
    """Run multiple scraper jobs in parallel (chord)."""
    from celery import group

    tasks = group(run_scraper_job.s(jid, cfg) for jid, cfg in zip(job_ids, configs))
    result = tasks.apply_async()

    return {"status": "bulk_started", "count": len(job_ids), "group_id": str(result.id)}


@celery.task(bind=True, name="app.tasks.scraper_tasks.test_url")
def test_url(self, url: str, engine: str = "requests") -> Dict:
    """Quick test-scrape a URL — returns status, response time, basic info."""
    import requests as req
    start = time.time()

    try:
        resp = req.get(url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (compatible; DataHarvest/2.0)"
        })
        duration = time.time() - start
        return {
            "url": url,
            "reachable": True,
            "status_code": resp.status_code,
            "response_time_ms": round(duration * 1000),
            "content_type": resp.headers.get("Content-Type", ""),
            "content_length": len(resp.content),
            "server": resp.headers.get("Server", ""),
            "has_cloudflare": "cloudflare" in str(resp.headers).lower(),
            "has_javascript": "<script" in resp.text.lower(),
        }
    except Exception as e:
        return {
            "url": url,
            "reachable": False,
            "error": str(e),
            "response_time_ms": round((time.time() - start) * 1000),
        }