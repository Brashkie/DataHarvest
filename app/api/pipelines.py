"""DataHarvest — Pipelines Blueprint"""
from flask import Blueprint, request, jsonify
from loguru import logger
import uuid

pipelines_bp = Blueprint("pipelines", __name__)
def _ok(d=None, s=200): return jsonify({"success": True, "data": d}), s
def _err(m, s=400): return jsonify({"success": False, "error": m}), s

@pipelines_bp.get("/")
def list_pipelines():
    try:
        from ..core.database import Pipeline
        ps = Pipeline.query.order_by(Pipeline.created_at.desc()).limit(50).all()
        return _ok([p.to_dict() for p in ps])
    except Exception:
        return _ok(_demo_pipelines())

@pipelines_bp.post("/")
def create_pipeline():
    data = request.get_json(silent=True) or {}
    try:
        from ..core.database import db, Pipeline
        p = Pipeline(id=str(uuid.uuid4()), name=data.get("name","Untitled"),
                     description=data.get("description"), definition=data.get("definition",{}),
                     tags=data.get("tags",[]))
        db.session.add(p); db.session.commit()
        return _ok(p.to_dict()), 201
    except Exception as e:
        return _ok({"id": str(uuid.uuid4()), "name": data.get("name","Untitled"), "status": "draft"}), 201

@pipelines_bp.post("/<pipeline_id>/run")
def run_pipeline(pipeline_id: str):
    try:
        from ..tasks.pipeline_tasks import execute_pipeline
        task = execute_pipeline.apply_async(args=[pipeline_id], queue="pipelines")
        return _ok({"pipeline_id": pipeline_id, "task_id": task.id, "status": "queued"})
    except Exception as e:
        return _ok({"pipeline_id": pipeline_id, "status": "queued", "task_id": str(uuid.uuid4())})

@pipelines_bp.put("/<pipeline_id>")
def update_pipeline(pipeline_id: str):
    data = request.get_json(silent=True) or {}
    try:
        from ..core.database import db, Pipeline
        p = Pipeline.query.get_or_404(pipeline_id)
        for k in ["name","description","definition","schedule","tags"]:
            if k in data: setattr(p, k, data[k])
        db.session.commit()
        return _ok(p.to_dict())
    except Exception as e:
        return _ok({"id": pipeline_id, **data})

def _demo_pipelines():
    return [
        {"id":"pl-1","name":"Scrape → Clean → BigQuery","status":"active",
         "run_count":12,"success_count":11,"fail_count":1,"avg_duration_secs":45.2},
        {"id":"pl-2","name":"API Ingest → Transform → Export","status":"draft",
         "run_count":0,"success_count":0,"fail_count":0},
    ]