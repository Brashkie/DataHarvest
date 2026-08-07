"""
DataHarvest — Utility Helpers
"""
from __future__ import annotations
import re
import uuid
import hashlib
from typing import Any, Dict, List, Optional
from datetime import datetime
import numpy as np
import pandas as pd


# ── Response Helpers ──────────────────────────────────────────────────────────

def success(data: Any = None, message: str = "OK", status: int = 200):
    from flask import jsonify
    return jsonify({"success": True, "message": message, "data": data, "ts": datetime.utcnow().isoformat()}), status


def error(message: str, status: int = 400, details: Any = None):
    from flask import jsonify
    return jsonify({"success": False, "error": message, "details": details}), status


# ── Data Utilities ────────────────────────────────────────────────────────────

def df_to_safe_dict(df: pd.DataFrame, limit: int = 1000) -> List[Dict]:
    """Convert DataFrame to JSON-safe list of dicts."""
    return df.head(limit).replace({np.nan: None, np.inf: None, -np.inf: None}).to_dict("records")


def infer_column_types(df: pd.DataFrame) -> Dict[str, str]:
    """Map pandas dtypes to friendly names."""
    type_map = {
        "int64": "integer", "int32": "integer",
        "float64": "float", "float32": "float",
        "object": "text", "bool": "boolean",
        "datetime64[ns]": "datetime",
    }
    return {col: type_map.get(str(dt), str(dt)) for col, dt in df.dtypes.items()}


def detect_primary_key(df: pd.DataFrame) -> Optional[str]:
    """Guess which column is most likely the primary key."""
    for col in df.columns:
        if df[col].nunique() == len(df) and df[col].notna().all():
            return col
    return None


def smart_cast_column(series: pd.Series) -> pd.Series:
    """Try to cast object series to numeric or datetime."""
    # Try numeric
    try:
        return pd.to_numeric(series)
    except Exception:
        pass
    # Try datetime
    try:
        return pd.to_datetime(series, infer_datetime_format=True)
    except Exception:
        pass
    return series


# ── URL / Domain Utils ────────────────────────────────────────────────────────

def extract_domain(url: str) -> str:
    from urllib.parse import urlparse
    return urlparse(url).netloc.lower()


def is_valid_url(url: str) -> bool:
    pattern = re.compile(
        r"^https?://"
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
        r"localhost|"
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
        r"(?::\d+)?"
        r"(?:/?|[/?]\S+)$",
        re.IGNORECASE,
    )
    return bool(pattern.match(url))


def normalize_url(url: str) -> str:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url.rstrip("/")


# ── Hash / ID Utils ───────────────────────────────────────────────────────────

def hash_url(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def short_id() -> str:
    return uuid.uuid4().hex[:12]


# ── Cron / Schedule Utils ─────────────────────────────────────────────────────

def validate_cron(expression: str) -> bool:
    """Basic cron validation (5-field)."""
    parts = expression.strip().split()
    return len(parts) == 5


def next_run_from_cron(expression: str) -> Optional[datetime]:
    """Get next run datetime from a cron expression."""
    try:
        from apscheduler.triggers.cron import CronTrigger
        fields = expression.split()
        trigger = CronTrigger(
            minute=fields[0], hour=fields[1], day=fields[2],
            month=fields[3], day_of_week=fields[4]
        )
        return trigger.get_next_fire_time(None, datetime.utcnow())
    except Exception:
        return None


# ── File Utils ────────────────────────────────────────────────────────────────

def human_size(n_bytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if n_bytes < 1024:
            return f"{n_bytes:.1f} {unit}"
        n_bytes /= 1024
    return f"{n_bytes:.1f} PB"


def safe_filename(name: str) -> str:
    """Strip unsafe chars from filename."""
    return re.sub(r"[^\w\-_\.]", "_", name)