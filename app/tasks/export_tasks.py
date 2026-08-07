"""DataHarvest — Export Celery Tasks"""
from __future__ import annotations
from ..core.celery_app import celery
from loguru import logger


@celery.task(bind=True, name="app.tasks.export_tasks.export_dataset")
def export_dataset(self, export_id: str, dataset_id: str, fmt: str, config: dict):
    logger.info(f"▶ Exporting dataset [{dataset_id}] as {fmt}")
    try:
        import pandas as pd, os
        from ..core.database import Dataset
        ds = Dataset.query.get(dataset_id)
        if not ds:
            raise ValueError(f"Dataset {dataset_id} not found")

        df = pd.read_parquet(ds.storage_path)
        os.makedirs("./exports", exist_ok=True)
        path = f"./exports/{export_id}.{fmt}"

        if fmt == "csv":
            df.to_csv(path, index=False)
        elif fmt == "xlsx":
            df.to_excel(path, index=False, engine="xlsxwriter")
        elif fmt == "parquet":
            df.to_parquet(path, index=False)
        elif fmt == "json":
            df.to_json(path, orient="records", indent=2)

        size = os.path.getsize(path)
        logger.info(f"✅ Export [{export_id}] done — {size} bytes")
        return {"export_id": export_id, "path": path, "size_bytes": size}
    except Exception as e:
        logger.error(f"Export [{export_id}] failed: {e}")
        raise self.retry(exc=e, countdown=10)