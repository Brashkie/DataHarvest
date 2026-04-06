"""
DataHarvest — Analytics API Blueprint
"""
from flask import Blueprint, request, jsonify
import numpy as np
import pandas as pd
from loguru import logger

analytics_bp = Blueprint("analytics", __name__)

def _ok(data=None, message="OK", status=200):
    return jsonify({"success": True, "data": data, "message": message}), status

def _err(msg, status=400):
    return jsonify({"success": False, "error": msg}), status


@analytics_bp.post("/profile")
def profile_dataset():
    """Run auto-EDA profile on a dataset."""
    data = request.get_json(silent=True) or {}
    dataset_id = data.get("dataset_id")
    rows = data.get("rows")  # inline data

    try:
        from ..analytics.engines.analytics_engine import DataProfiler, DataLoader

        if rows:
            df = pd.DataFrame(rows)
        elif dataset_id:
            from ..core.database import Dataset
            ds = Dataset.query.get_or_404(dataset_id)
            df = DataLoader.from_file(ds.storage_path)
        else:
            return _err("Provide dataset_id or rows")

        profiler = DataProfiler(df)
        fast = data.get("fast", False)
        report = profiler.profile(fast=fast)
        return _ok(report)

    except Exception as e:
        logger.error(f"Profile failed: {e}")
        return _err(str(e))


@analytics_bp.post("/chart")
def generate_chart():
    """Generate a Plotly chart from dataset."""
    data = request.get_json(silent=True) or {}
    rows = data.get("rows", [])
    chart_type = data.get("chart_type", "histogram")
    kwargs = data.get("options", {})

    try:
        from ..analytics.engines.analytics_engine import ChartGenerator
        df = pd.DataFrame(rows)
        gen = ChartGenerator(df)
        chart_json = gen.to_plotly(chart_type, **kwargs)
        return _ok({"chart": chart_json, "chart_type": chart_type})
    except Exception as e:
        return _err(str(e))


@analytics_bp.post("/patterns")
def detect_patterns():
    """Detect patterns, trends, anomalies in data."""
    data = request.get_json(silent=True) or {}
    rows = data.get("rows", [])
    analyses = data.get("analyses", ["trends", "anomalies", "patterns"])

    try:
        from ..analytics.engines.analytics_engine import PatternDetector, DataProfiler
        df = pd.DataFrame(rows)
        detector = PatternDetector(df)
        results = {}

        if "trends" in analyses:
            numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
            results["trends"] = {
                col: detector.detect_trends(col)
                for col in numeric_cols[:5]
            }

        if "anomalies" in analyses:
            numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
            results["anomalies"] = {
                col: detector.detect_anomalies(col)
                for col in numeric_cols[:5]
            }

        if "patterns" in analyses:
            profiler = DataProfiler(df)
            results["patterns"] = profiler._pattern_report()

        return _ok(results)
    except Exception as e:
        return _err(str(e))


@analytics_bp.post("/correlations")
def get_correlations():
    """Compute correlation matrix."""
    data = request.get_json(silent=True) or {}
    rows = data.get("rows", [])

    try:
        df = pd.DataFrame(rows)
        numeric = df.select_dtypes(include=np.number)
        if numeric.shape[1] < 2:
            return _err("Need at least 2 numeric columns")

        corr = numeric.corr().round(3).fillna(0)
        return _ok({
            "columns": corr.columns.tolist(),
            "matrix": corr.values.tolist(),
        })
    except Exception as e:
        return _err(str(e))


@analytics_bp.post("/sql")
def run_sql_query():
    """Run SQL query on uploaded/scraped data using DuckDB."""
    data = request.get_json(silent=True) or {}
    query = data.get("query", "")
    rows = data.get("rows", [])

    if not query:
        return _err("query is required")

    try:
        import duckdb
        df = pd.DataFrame(rows)
        # Register as temp table
        result_df = duckdb.execute(f"WITH data AS (SELECT * FROM df) {query}").df()
        return _ok({
            "columns": result_df.columns.tolist(),
            "rows": result_df.fillna("").to_dict("records"),
            "total_rows": len(result_df),
        })
    except Exception as e:
        return _err(str(e))