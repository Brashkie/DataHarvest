"""
DataHarvest — SocketIO Event Handlers
Real-time job progress, live metrics, pipeline updates
"""
from __future__ import annotations

import time
import threading
from loguru import logger

from app import socketio


# ── Connection Events ─────────────────────────────────────────────────────────

@socketio.on("connect")
def on_connect(auth=None):
    from flask_socketio import emit
    logger.debug(f"Client connected")
    emit("server:ready", {
        "status": "ok",
        "version": "2.0.0",
        "timestamp": time.time(),
    })


@socketio.on("disconnect")
def on_disconnect():
    logger.debug("Client disconnected")


# ── Job Subscriptions ─────────────────────────────────────────────────────────

@socketio.on("job:subscribe")
def on_job_subscribe(data):
    from flask_socketio import join_room, emit
    job_id = data.get("job_id")
    if job_id:
        join_room(f"job:{job_id}")
        emit("job:subscribed", {"job_id": job_id})
        logger.debug(f"Client subscribed to job: {job_id}")


@socketio.on("job:unsubscribe")
def on_job_unsubscribe(data):
    from flask_socketio import leave_room
    job_id = data.get("job_id")
    if job_id:
        leave_room(f"job:{job_id}")


# ── System Metrics Stream ─────────────────────────────────────────────────────

@socketio.on("metrics:subscribe")
def on_metrics_subscribe():
    """Start streaming system metrics to the client every 2 seconds."""
    from flask_socketio import emit
    import psutil

    def stream():
        for _ in range(150):  # max 5 min stream
            try:
                cpu = psutil.cpu_percent(interval=0.5)
                mem = psutil.virtual_memory()
                socketio.emit("metrics:update", {
                    "cpu_pct": cpu,
                    "memory_pct": mem.percent,
                    "memory_used_gb": round(mem.used / 1e9, 2),
                    "timestamp": time.time(),
                })
                time.sleep(2)
            except Exception:
                break

    t = threading.Thread(target=stream, daemon=True)
    t.start()
    emit("metrics:streaming", {"interval_ms": 2000})


# ── Pipeline Events ───────────────────────────────────────────────────────────

@socketio.on("pipeline:subscribe")
def on_pipeline_subscribe(data):
    from flask_socketio import join_room, emit
    pipeline_id = data.get("pipeline_id")
    if pipeline_id:
        join_room(f"pipeline:{pipeline_id}")
        emit("pipeline:subscribed", {"pipeline_id": pipeline_id})


# ── Log Tail ──────────────────────────────────────────────────────────────────

@socketio.on("logs:tail")
def on_logs_tail(data):
    """Stream last N log lines and then new ones."""
    from flask_socketio import emit
    import os

    log_path = "./logs/dataharvest.log"
    lines_requested = int(data.get("lines", 50))

    try:
        if os.path.exists(log_path):
            with open(log_path, "r") as f:
                all_lines = f.readlines()
            last_lines = [l.rstrip() for l in all_lines[-lines_requested:]]
            emit("logs:batch", {"lines": last_lines})
        else:
            emit("logs:batch", {"lines": ["[DataHarvest] Log file not yet created"]})
    except Exception as e:
        emit("logs:error", {"error": str(e)})


def emit_job_progress(job_id: str, data: dict) -> None:
    """Utility: emit progress to job room (callable from tasks)."""
    socketio.emit("job:progress", {"job_id": job_id, **data}, room=f"job:{job_id}")


def emit_pipeline_update(pipeline_id: str, data: dict) -> None:
    socketio.emit("pipeline:update", {"pipeline_id": pipeline_id, **data}, room=f"pipeline:{pipeline_id}")