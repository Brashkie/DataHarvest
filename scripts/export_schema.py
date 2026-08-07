"""
DataHarvest — Pydantic → JSON Schema exporter

Dumps every request/response model in app.schemas.requests into a single
combined JSON Schema document ($defs keyed by model name). Consumed by
scripts/gen-types.mjs to generate TypeScript types, so the frontend never
hand-writes types that drift from the backend contract.

Loads requests.py directly by file path (importlib) instead of importing
the `app` package, so this only needs `pydantic` installed — not the full
Flask/Celery/loguru stack pulled in by app/__init__.py. Keeps this script
usable in a minimal CI job and as a standalone tool.

Usage:
    python scripts/export_schema.py            # prints JSON to stdout
    python scripts/export_schema.py --out FILE  # writes to FILE instead
"""
from __future__ import annotations

import argparse
import importlib.util
import inspect
import json
from pathlib import Path

from pydantic import BaseModel
from pydantic.json_schema import models_json_schema

SCHEMA_FILE = Path(__file__).resolve().parent.parent / "app" / "schemas" / "requests.py"


def load_schemas_module():
    spec = importlib.util.spec_from_file_location("dataharvest_schemas", SCHEMA_FILE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


schemas_module = load_schemas_module()


def collect_models() -> list[type[BaseModel]]:
    models = []
    for _, obj in inspect.getmembers(schemas_module, inspect.isclass):
        if (
            issubclass(obj, BaseModel)
            and obj is not BaseModel
            and obj.__module__ == schemas_module.__name__
        ):
            models.append(obj)
    return models


def build_schema() -> dict:
    models = collect_models()
    _, top_level_schema = models_json_schema(
        [(m, "validation") for m in models],
        title="DataHarvestSchemas",
    )
    return top_level_schema


def main() -> None:
    parser = argparse.ArgumentParser(description="Export Pydantic schemas to JSON Schema")
    parser.add_argument("--out", default=None, help="Write to this file instead of stdout")
    args = parser.parse_args()

    schema = build_schema()
    text = json.dumps(schema, indent=2)

    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")
    else:
        print(text)


if __name__ == "__main__":
    main()
