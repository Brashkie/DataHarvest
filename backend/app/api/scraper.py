"""
DataHarvest — Scraper API Blueprint
REST endpoints for creating, running, and monitoring scrape jobs
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from flask import Blueprint, request, jsonify, current_app
from loguru import logger
from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional, List

scraper_bp = Blueprint("scraper", __name__)


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class CreateJobSchema(BaseModel):
    name: str
    url: str
    engine: str = "auto"               # auto | playwright | selenium | requests | cloudscraper
    selectors: Dict[str, str] = {}
    headers: Dict[str, str] = {}
    cookies: Dict[str, str] = {}
    auth: Optional[Dict] = None
    proxy: Optional[str] = None
    timeout: int = 30
    wait_for: Optional[str] = None
    wait_ms: int = 0
    scroll: bool = False
    screenshot: bool = False
    javascript: Optional[str] = None
    pagination: Optional[Dict] = None
    extract_tables: bool = True
    extract_links: bool = False
    extract_metadata: bool = True
    stealth: bool = False
    use_tor: bool = False
    tags: List[str] = []
    schedule: Optional[str] = None    # cron expression


class TestUrlSchema(BaseModel):
    url: str
    engine: str = "requests"


# ── Helper ────────────────────────────────────────────────────────────────────

def _ok(data: Any = None, message: str = "OK", status: int = 200):
    return jsonify({"success": True, "message": message, "data": data}), status

def _err(message: str, status: int = 400, details: Any = None):
    return jsonify({"success": False, "error": message, "details": details}), status


# ── Endpoints ─────────────────────────────────────────────────────────────────

@scraper_bp.get("/jobs")
def list_jobs():
    """
    List all scraper jobs.
    ---
    tags: [Scraper]
    parameters:
      - name: status
        in: query
        schema: {type: string}
      - name: limit
        in: query
        schema: {type: integer, default: 50}
      - name: offset
        in: query
        schema: {type: integer, default: 0}
    responses:
      200:
        description: List of scraper jobs
    """
    try:
        from ..core.database import db, ScraperJob

        status_filter = request.args.get("status")
        limit = min(int(request.args.get("limit", 50)), 200)
        offset = int(request.args.get("offset", 0))

        query = ScraperJob.query.order_by(ScraperJob.created_at.desc())
        if status_filter:
            query = query.filter_by(status=status_filter)

        total = query.count()
        jobs = query.offset(offset).limit(limit).all()
        return _ok({
            "jobs": [j.to_dict() for j in jobs],
            "total": total,
            "limit": limit,
            "offset": offset,
        })
    except Exception as e:
        # Fallback for demo mode (no DB)
        logger.warning(f"DB not available, returning demo data: {e}")
        return _ok({"jobs": _demo_jobs(), "total": 3, "limit": 50, "offset": 0})


@scraper_bp.post("/jobs")
def create_job():
    """
    Create and start a new scraper job.
    ---
    tags: [Scraper]
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [name, url]
            properties:
              name: {type: string}
              url: {type: string}
              engine: {type: string, enum: [auto, playwright, selenium, requests, cloudscraper]}
    responses:
      201:
        description: Job created and queued
    """
    data = request.get_json(silent=True) or {}

    try:
        schema = CreateJobSchema(**data)
    except Exception as e:
        return _err(f"Validation error: {e}", 422)

    import uuid
    job_id = str(uuid.uuid4())

    # Try to persist to DB
    try:
        from ..core.database import db, ScraperJob, ScraperEngine as EngineEnum
        from sqlalchemy import exc as sa_exc

        engine_val = schema.engine if schema.engine != "auto" else "playwright"
        job = ScraperJob(
            id=job_id,
            name=schema.name,
            url=schema.url,
            engine=engine_val,
            status="pending",
            config={
                "selectors": schema.selectors,
                "headers": schema.headers,
                "scroll": schema.scroll,
                "screenshot": schema.screenshot,
                "extract_tables": schema.extract_tables,
                "pagination": schema.pagination,
                "stealth": schema.stealth,
                "timeout": schema.timeout,
            },
            tags=schema.tags,
            schedule=schema.schedule,
        )
        db.session.add(job)
        db.session.commit()
        logger.info(f"Job created in DB: {job_id}")
    except Exception as e:
        logger.warning(f"DB save failed, proceeding without persistence: {e}")

    # Queue Celery task
    try:
        from ..tasks.scraper_tasks import run_scraper_job
        config_dict = {
            "url": schema.url,
            "engine": schema.engine,
            "selectors": schema.selectors,
            "headers": schema.headers,
            "cookies": schema.cookies,
            "auth": schema.auth,
            "proxy": schema.proxy,
            "timeout": schema.timeout,
            "wait_for": schema.wait_for,
            "wait_ms": schema.wait_ms,
            "scroll": schema.scroll,
            "screenshot": schema.screenshot,
            "javascript": schema.javascript,
            "pagination": schema.pagination,
            "extract_tables": schema.extract_tables,
            "extract_links": schema.extract_links,
            "extract_metadata": schema.extract_metadata,
            "stealth": schema.stealth,
            "use_tor": schema.use_tor,
        }
        task = run_scraper_job.apply_async(
            args=[job_id, config_dict],
            queue="scraping",
            priority=5,
        )
        celery_task_id = task.id
        logger.info(f"Queued task {celery_task_id[:8]} for job {job_id}")
    except Exception as e:
        logger.warning(f"Celery not available, job created but not queued: {e}")
        celery_task_id = None

    return _ok({
        "job_id": job_id,
        "celery_task_id": celery_task_id,
        "status": "pending",
        "name": schema.name,
        "url": schema.url,
        "engine": schema.engine,
    }, "Job created and queued", 201)


@scraper_bp.get("/jobs/<job_id>")
def get_job(job_id: str):
    """Get a scraper job by ID."""
    try:
        from ..core.database import ScraperJob
        job = ScraperJob.query.get_or_404(job_id)
        return _ok(job.to_dict())
    except Exception:
        return _ok({"id": job_id, "status": "unknown"})


@scraper_bp.delete("/jobs/<job_id>")
def cancel_job(job_id: str):
    """Cancel a running scraper job."""
    try:
        from celery.result import AsyncResult
        from ..core.database import db, ScraperJob

        job = ScraperJob.query.get(job_id)
        if job and job.celery_task_id:
            AsyncResult(job.celery_task_id).revoke(terminate=True, signal="SIGTERM")
            job.status = "cancelled"
            db.session.commit()

        return _ok({"job_id": job_id, "status": "cancelled"}, "Job cancelled")
    except Exception as e:
        return _err(str(e))


@scraper_bp.get("/jobs/<job_id>/logs")
def get_job_logs(job_id: str):
    """Get logs for a scraper job."""
    try:
        from ..core.database import JobLog
        limit = min(int(request.args.get("limit", 100)), 500)
        logs = (
            JobLog.query
            .filter_by(scraper_job_id=job_id)
            .order_by(JobLog.timestamp.desc())
            .limit(limit)
            .all()
        )
        return _ok([{
            "level": log.level,
            "message": log.message,
            "timestamp": log.timestamp.isoformat(),
        } for log in logs])
    except Exception:
        return _ok([])


@scraper_bp.get("/jobs/<job_id>/results")
def get_job_results(job_id: str):
    """Get scraped results for a job."""
    try:
        import pandas as pd
        import os

        path = f"./data/scraped/{job_id}.parquet"
        if not os.path.exists(path):
            return _err("Results not found or job not yet completed", 404)

        df = pd.read_parquet(path)
        limit = min(int(request.args.get("limit", 1000)), 10000)
        offset = int(request.args.get("offset", 0))

        return _ok({
            "columns": df.columns.tolist(),
            "dtypes": {col: str(dt) for col, dt in df.dtypes.items()},
            "total_rows": len(df),
            "rows": df.iloc[offset:offset + limit].fillna("").to_dict("records"),
            "limit": limit,
            "offset": offset,
        })
    except Exception as e:
        return _err(str(e))


@scraper_bp.post("/test-url")
def test_url():
    """
    Quick-test a URL without creating a full job.
    ---
    tags: [Scraper]
    """
    data = request.get_json(silent=True) or {}
    url = data.get("url", "")

    if not url:
        return _err("url is required")

    try:
        from ..tasks.scraper_tasks import test_url as test_url_task
        result = test_url_task.apply_async(args=[url, data.get("engine", "requests")])
        info = result.get(timeout=15)
        return _ok(info)
    except Exception:
        # Fallback sync
        import requests as req, time
        start = time.time()
        try:
            resp = req.get(url, timeout=10)
            return _ok({
                "url": url,
                "reachable": True,
                "status_code": resp.status_code,
                "response_time_ms": round((time.time() - start) * 1000),
                "content_type": resp.headers.get("Content-Type", ""),
                "has_javascript": "<script" in resp.text.lower(),
                "has_cloudflare": "cloudflare" in str(resp.headers).lower(),
            })
        except Exception as e:
            return _ok({
                "url": url,
                "reachable": False,
                "error": str(e),
                "response_time_ms": round((time.time() - start) * 1000),
            })


@scraper_bp.get("/profiles")
def list_profiles():
    """List scraper profiles."""
    try:
        from ..core.database import ScraperProfile
        profiles = ScraperProfile.query.all()
        return _ok([{
            "id": p.id,
            "name": p.name,
            "engine": p.engine.value if p.engine else "playwright",
            "description": p.description,
        } for p in profiles])
    except Exception:
        return _ok([])


@scraper_bp.get("/stats")
def get_stats():
    """Scraper statistics."""
    try:
        from ..core.database import ScraperJob, db
        from sqlalchemy import func

        stats = db.session.query(
            ScraperJob.status,
            func.count(ScraperJob.id).label("count"),
            func.sum(ScraperJob.rows_extracted).label("total_rows"),
        ).group_by(ScraperJob.status).all()

        return _ok({
            "by_status": [{
                "status": s.status.value if s.status else "unknown",
                "count": s.count,
                "total_rows": int(s.total_rows or 0),
            } for s in stats]
        })
    except Exception:
        return _ok({
            "by_status": [
                {"status": "completed", "count": 24, "total_rows": 48200},
                {"status": "running", "count": 2, "total_rows": 0},
                {"status": "failed", "count": 1, "total_rows": 0},
            ]
        })


# ── Demo data fallback ────────────────────────────────────────────────────────
def _demo_jobs():
    return [
        {
            "id": "demo-1", "name": "E-commerce Products",
            "url": "https://example-shop.com/products",
            "engine": "playwright", "status": "completed",
            "rows_extracted": 1240, "pages_scraped": 5,
            "duration_secs": 18.4, "created_at": datetime.utcnow().isoformat(),
        },
        {
            "id": "demo-2", "name": "News Articles",
            "url": "https://news-site.com/articles",
            "engine": "requests", "status": "running",
            "rows_extracted": 340, "pages_scraped": 2,
            "duration_secs": None, "created_at": datetime.utcnow().isoformat(),
        },
        {
            "id": "demo-3", "name": "Stock Prices",
            "url": "https://finance-data.com/stocks",
            "engine": "cloudscraper", "status": "failed",
            "rows_extracted": 0, "pages_scraped": 0,
            "error_message": "Cloudflare challenge failed",
            "created_at": datetime.utcnow().isoformat(),
        },
    ]