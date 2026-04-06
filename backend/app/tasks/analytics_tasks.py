# app/tasks/analytics_tasks.py
"""DataHarvest — Analytics Celery Tasks"""
from __future__ import annotations
from ..core.celery_app import celery
from loguru import logger


@celery.task(bind=True, name="app.tasks.analytics_tasks.run_profile")
def run_profile(self, dataset_id: str, config: dict = None) -> dict:
    logger.info(f"Running profile for dataset {dataset_id}")
    try:
        import pandas as pd
        import os
        path = f"./data/uploads/{dataset_id}.parquet"
        if not os.path.exists(path):
            return {"success": False, "error": "Dataset not found"}
        df = pd.read_parquet(path)
        return {
            "success": True,
            "shape": {"rows": len(df), "columns": len(df.columns)},
            "memory_mb": round(df.memory_usage(deep=True).sum() / 1e6, 2),
            "dtypes": {c: str(t) for c, t in df.dtypes.items()},
        }
    except Exception as e:
        logger.error(f"Profile failed: {e}")
        return {"success": False, "error": str(e)}


@celery.task(bind=True, name="app.tasks.analytics_tasks.run_sql")
def run_sql(self, query: str, dataset_id: str) -> dict:
    logger.info(f"Running SQL on dataset {dataset_id}")
    try:
        import duckdb, pandas as pd
        df = pd.read_parquet(f"./data/uploads/{dataset_id}.parquet")
        conn = duckdb.connect()
        conn.register("data", df)
        result = conn.execute(query).df()
        return {
            "success": True,
            "columns": result.columns.tolist(),
            "rows": result.head(1000).to_dict("records"),
            "total_rows": len(result),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}