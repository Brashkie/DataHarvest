"""DataHarvest — Monitor Blueprint"""
from flask import Blueprint, jsonify
import psutil, time, os
from loguru import logger

monitor_bp = Blueprint("monitor", __name__)
def _ok(d=None): return jsonify({"success": True, "data": d})


@monitor_bp.get("/system")
def system_metrics():
    cpu_pct = psutil.cpu_percent(interval=0.2)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage(".")
    net = psutil.net_io_counters()

    cores = []
    for i, pct in enumerate(psutil.cpu_percent(percpu=True, interval=0.1)):
        cores.append({"core": i, "pct": pct})

    return _ok({
        "cpu": {"pct": cpu_pct, "cores": cores, "count": psutil.cpu_count()},
        "memory": {
            "total_gb": round(mem.total / 1e9, 2),
            "used_gb": round(mem.used / 1e9, 2),
            "available_gb": round(mem.available / 1e9, 2),
            "pct": mem.percent,
        },
        "disk": {
            "total_gb": round(disk.total / 1e9, 2),
            "used_gb": round(disk.used / 1e9, 2),
            "free_gb": round(disk.free / 1e9, 2),
            "pct": disk.percent,
        },
        "network": {
            "bytes_sent_mb": round(net.bytes_sent / 1e6, 2),
            "bytes_recv_mb": round(net.bytes_recv / 1e6, 2),
        },
        "timestamp": time.time(),
    })


@monitor_bp.get("/celery")
def celery_stats():
    try:
        from ..core.celery_app import celery
        inspect = celery.control.inspect(timeout=3)
        active = inspect.active() or {}
        reserved = inspect.reserved() or {}
        stats = inspect.stats() or {}
        return _ok({
            "workers": list(stats.keys()),
            "active_tasks": sum(len(v) for v in active.values()),
            "reserved_tasks": sum(len(v) for v in reserved.values()),
            "worker_count": len(stats),
        })
    except Exception:
        return _ok({"workers": [], "active_tasks": 0, "worker_count": 0})


@monitor_bp.get("/logs")
def recent_logs():
    try:
        log_path = "./logs/dataharvest.log"
        if not os.path.exists(log_path):
            return _ok({"lines": [], "total": 0})
        with open(log_path, "r") as f:
            lines = f.readlines()[-200:]
        return _ok({"lines": [l.rstrip() for l in lines], "total": len(lines)})
    except Exception as e:
        return _ok({"lines": [str(e)], "total": 0})