"""DataHarvest — Tables API (Pandas/Polars/Parquet)"""
from flask import Blueprint, request, jsonify, send_file
import pandas as pd
import polars as pl
import pyarrow as pa
import pyarrow.parquet as pq
import numpy as np
import uuid, os
from loguru import logger
from pathlib import Path

tables_bp = Blueprint("tables", __name__)

UPLOAD_DIR = Path("./data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def _ok(data=None, status=200): return jsonify({"success": True,  "data": data}), status
def _err(msg, status=400):      return jsonify({"success": False, "error": msg}), status

# ── Helpers ────────────────────────────────────────────────────────────────────

def _read_parquet_polars(path: str) -> pl.DataFrame:
    """Lee Parquet con Polars (más rápido que Pandas para datasets grandes)"""
    return pl.read_parquet(path)

def _df_to_parquet(df: pd.DataFrame, path: str):
    """Guarda DataFrame en Parquet optimizado con PyArrow"""
    table = pa.Table.from_pandas(df, preserve_index=False)
    pq.write_table(table, path, compression="snappy", row_group_size=50000)

def _infer_storage_path(dataset_id: str) -> str:
    return str(UPLOAD_DIR / f"{dataset_id}.parquet")

# ── Endpoints ──────────────────────────────────────────────────────────────────

@tables_bp.get("/datasets")
def list_datasets():
    try:
        from ..core.database import Dataset
        datasets = Dataset.query.order_by(Dataset.created_at.desc()).limit(50).all()
        return _ok([d.to_dict() for d in datasets])
    except Exception:
        return _ok(_demo_datasets())


@tables_bp.get("/datasets/<dataset_id>")
def get_dataset(dataset_id: str):
    limit  = min(int(request.args.get("limit",  500)), 5000)
    offset = int(request.args.get("offset", 0))
    try:
        path = _infer_storage_path(dataset_id)
        if not os.path.exists(path):
            return _err("Dataset not found", 404)

        # Polars para lectura rápida
        lf = pl.scan_parquet(path)
        total = lf.select(pl.len()).collect().item()
        df = lf.slice(offset, limit).collect()

        # Metadata del Parquet
        meta = pq.read_metadata(path)

        return _ok({
            "id":           dataset_id,
            "columns":      df.columns,
            "dtypes":       {c: str(t) for c, t in zip(df.columns, df.dtypes)},
            "total_rows":   total,
            "row_groups":   meta.num_row_groups,
            "size_bytes":   os.path.getsize(path),
            "rows":         df.fill_null("").to_dicts(),
        })
    except Exception as e:
        logger.error(f"get_dataset error: {e}")
        return _err(str(e))


@tables_bp.post("/datasets/upload")
def upload_dataset():
    if "file" not in request.files:
        return _err("No file provided")

    file = request.files["file"]
    ext  = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "csv"
    uid  = str(uuid.uuid4())
    raw_path = UPLOAD_DIR / f"{uid}.{ext}"
    pq_path  = UPLOAD_DIR / f"{uid}.parquet"

    file.save(str(raw_path))

    try:
        # Lectura según formato
        if ext == "csv":
            df = pl.read_csv(str(raw_path), infer_schema_length=1000)
        elif ext == "json":
            df = pl.read_json(str(raw_path))
        elif ext in ("xlsx", "xls"):
            df = pl.from_pandas(pd.read_excel(str(raw_path)))
        elif ext == "parquet":
            df = pl.read_parquet(str(raw_path))
        else:
            df = pl.from_pandas(pd.read_csv(str(raw_path)))

        # Guarda como Parquet optimizado
        df.write_parquet(str(pq_path), compression="snappy", row_group_size=50000)

        # Limpia archivo original
        os.remove(str(raw_path))

        return _ok({
            "dataset_id": uid,
            "filename":   file.filename,
            "rows":       len(df),
            "columns":    df.columns,
            "dtypes":     {c: str(t) for c, t in zip(df.columns, df.dtypes)},
            "size_bytes": os.path.getsize(str(pq_path)),
        }), 201

    except Exception as e:
        logger.error(f"upload_dataset error: {e}")
        return _err(str(e))


@tables_bp.post("/datasets/<dataset_id>/transform")
def transform_dataset(dataset_id: str):
    data       = request.get_json(silent=True) or {}
    operations = data.get("operations", [])

    try:
        path = _infer_storage_path(dataset_id)
        df   = pl.read_parquet(path)

        for op in operations:
            op_type = op.get("type")
            params  = op.get("params", {})

            if op_type == "filter":
                df = df.filter(pl.Expr.deserialize(params["expression"].encode()))
            elif op_type == "groupby":
                df = df.group_by(params["by"]).agg(pl.all().mean())
            elif op_type == "rename":
                df = df.rename(params["mapping"])
            elif op_type == "dropna":
                df = df.drop_nulls(subset=params.get("subset"))
            elif op_type == "fillna":
                df = df.fill_null(params.get("value", 0))
            elif op_type == "sort":
                df = df.sort(params["by"], descending=not params.get("asc", True))
            elif op_type == "drop_columns":
                df = df.drop(params["columns"])
            elif op_type == "cast":
                for col, dtype in params.get("dtypes", {}).items():
                    df = df.with_columns(pl.col(col).cast(eval(f"pl.{dtype}")))

        return _ok({
            "columns":    df.columns,
            "total_rows": len(df),
            "rows":       df.head(500).fill_null("").to_dicts(),
        })
    except Exception as e:
        logger.error(f"transform error: {e}")
        return _err(str(e))


@tables_bp.get("/datasets/<dataset_id>/export/<fmt>")
def export_dataset(dataset_id: str, fmt: str):
    """Exporta dataset a CSV, JSON, Excel o Parquet"""
    try:
        path = _infer_storage_path(dataset_id)
        df   = pl.read_parquet(path)
        out  = UPLOAD_DIR / f"{dataset_id}_export.{fmt}"

        if fmt == "csv":
            df.write_csv(str(out))
            mimetype = "text/csv"
        elif fmt == "json":
            df.write_json(str(out))
            mimetype = "application/json"
        elif fmt == "xlsx":
            df.to_pandas().to_excel(str(out), index=False)
            mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        elif fmt == "parquet":
            df.write_parquet(str(out), compression="snappy")
            mimetype = "application/octet-stream"
        else:
            return _err(f"Formato no soportado: {fmt}")

        return send_file(str(out), mimetype=mimetype,
                        as_attachment=True, download_name=f"dataset.{fmt}")
    except Exception as e:
        return _err(str(e))


@tables_bp.delete("/datasets/<dataset_id>")
def delete_dataset(dataset_id: str):
    try:
        path = _infer_storage_path(dataset_id)
        if os.path.exists(path):
            os.remove(path)
        return _ok({"deleted": dataset_id})
    except Exception as e:
        return _err(str(e))


@tables_bp.get("/datasets/<dataset_id>/info")
def dataset_info(dataset_id: str):
    """Metadata detallada del archivo Parquet"""
    try:
        path = _infer_storage_path(dataset_id)
        meta = pq.read_metadata(path)
        schema = pq.read_schema(path)

        return _ok({
            "num_rows":        meta.num_rows,
            "num_row_groups":  meta.num_row_groups,
            "num_columns":     meta.num_columns,
            "size_bytes":      os.path.getsize(path),
            "compression":     meta.row_group(0).column(0).compression,
            "columns": [
                {
                    "name":     schema.field(i).name,
                    "type":     str(schema.field(i).type),
                    "nullable": schema.field(i).nullable,
                }
                for i in range(len(schema))
            ],
        })
    except Exception as e:
        return _err(str(e))


def _demo_datasets():
    return [
        {"id": "ds-1", "name": "E-commerce Scrape", "row_count": 1240,
         "column_count": 8, "source_type": "scraper",
         "storage_format": "parquet", "size_bytes": 245000},
        {"id": "ds-2", "name": "Sales Q2 2024", "row_count": 45000,
         "column_count": 12, "source_type": "upload",
         "storage_format": "parquet", "size_bytes": 8900000},
    ]