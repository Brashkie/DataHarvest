"""DataHarvest — Health API"""
from flask import Blueprint, jsonify
import psutil, time, os
health_bp = Blueprint("health", __name__)

@health_bp.get("/")
def health():
    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage(".")
    return jsonify({
        "status": "ok",
        "version": "2.0.0",
        "timestamp": time.time(),
        "system": {
            "cpu_pct": cpu,
            "memory_pct": mem.percent,
            "memory_used_gb": round(mem.used / 1e9, 2),
            "disk_pct": disk.percent,
        }
    }), 200

@health_bp.get("/ping")
def ping():
    return jsonify({"pong": True, "ts": time.time()}), 200