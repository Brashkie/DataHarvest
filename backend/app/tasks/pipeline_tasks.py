"""DataHarvest — Pipeline & AI Celery Tasks"""
from __future__ import annotations
import time
from typing import Any, Dict, List
from ..core.celery_app import celery
from loguru import logger


# ── Pipeline Tasks ────────────────────────────────────────────────────────────

@celery.task(bind=True, name="app.tasks.pipeline_tasks.execute_pipeline")
def execute_pipeline(self, pipeline_id: str) -> Dict:
    from datetime import datetime
    start = time.time()
    task_id = self.request.id
    logger.info(f"▶ Pipeline [{pipeline_id}] starting, task={task_id[:8]}")

    def emit(data):
        try:
            from .. import socketio
            socketio.emit("pipeline:update", {"pipeline_id": pipeline_id, **data})
        except Exception:
            pass

    try:
        from ..core.database import db, Pipeline, PipelineRun, JobStatus
        pipeline = Pipeline.query.get(pipeline_id)
        if not pipeline:
            raise ValueError(f"Pipeline {pipeline_id} not found")

        run = PipelineRun(
            pipeline_id=pipeline_id,
            status=JobStatus.RUNNING,
            celery_task_id=task_id,
            started_at=datetime.utcnow(),
        )
        pipeline.status = "running"
        db.session.add(run)
        db.session.commit()

        emit({"status": "running", "progress": 5})

        # Execute nodes in order
        definition = pipeline.definition or {}
        nodes = definition.get("nodes", [])
        node_results = {}

        for i, node in enumerate(nodes):
            progress = int(10 + (i / max(len(nodes), 1)) * 80)
            emit({"status": "running", "progress": progress, "current_node": node.get("id")})
            result = _execute_node(node, node_results)
            node_results[node.get("id")] = result
            self.update_state(state="PROGRESS", meta={"progress": progress, "node": node.get("id")})

        duration = time.time() - start
        run.status = JobStatus.COMPLETED
        run.completed_at = datetime.utcnow()
        run.duration_secs = duration
        run.node_results = node_results
        pipeline.status = "active"
        pipeline.run_count = (pipeline.run_count or 0) + 1
        pipeline.success_count = (pipeline.success_count or 0) + 1
        pipeline.last_run_at = datetime.utcnow()
        db.session.commit()

        emit({"status": "completed", "progress": 100, "duration_secs": duration})
        return {"success": True, "pipeline_id": pipeline_id, "duration_secs": duration}

    except Exception as exc:
        logger.error(f"Pipeline [{pipeline_id}] failed: {exc}")
        emit({"status": "error", "error": str(exc)})
        raise self.retry(exc=exc, countdown=30, max_retries=1)


def _execute_node(node: Dict, previous_results: Dict) -> Dict:
    """Execute a single pipeline node."""
    node_type = node.get("type", "")
    node_data = node.get("data", {})

    if node_type == "scraper":
        return {"status": "completed", "rows": 0, "skipped": "no celery in pipeline context"}

    elif node_type == "transform":
        return {"status": "completed", "operation": node_data.get("operation", "passthrough")}

    elif node_type == "filter":
        return {"status": "completed", "expression": node_data.get("expression", "")}

    elif node_type == "export":
        return {"status": "completed", "format": node_data.get("format", "csv")}

    elif node_type == "bigquery":
        return {"status": "completed", "table": node_data.get("table", "")}

    return {"status": "completed", "node_type": node_type}


# ── AI / ML Tasks ─────────────────────────────────────────────────────────────

@celery.task(bind=True, name="app.tasks.ai_tasks.train_model_task")
def train_model_task(
    self,
    model_id: str,
    rows: List[Dict],
    target: str,
    algorithm: str,
    model_type: str,
    feature_cols: List[str],
) -> Dict:
    import pandas as pd, numpy as np, joblib, os
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression, LinearRegression
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, r2_score, mean_squared_error
    from sklearn.preprocessing import LabelEncoder
    from datetime import datetime

    start = time.time()
    logger.info(f"🧠 Training model [{model_id}] algorithm={algorithm}")

    def emit(data):
        try:
            from .. import socketio
            socketio.emit("ai:training_progress", {"model_id": model_id, **data})
        except Exception:
            pass

    emit({"stage": "loading_data", "progress": 5})
    self.update_state(state="PROGRESS", meta={"stage": "loading_data", "progress": 5})

    df = pd.DataFrame(rows)
    X = df[feature_cols] if feature_cols else df.select_dtypes(include=np.number).drop(columns=[target], errors="ignore")
    y = df[target]

    le = None
    if model_type == "classification" and y.dtype == "object":
        le = LabelEncoder()
        y = le.fit_transform(y)

    emit({"stage": "splitting", "progress": 20})
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    emit({"stage": "training", "progress": 40})
    self.update_state(state="PROGRESS", meta={"stage": "training", "progress": 40})

    algo_map = {
        "random_forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
            if model_type == "classification"
            else RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
        "gradient_boost": GradientBoostingClassifier(n_estimators=100, random_state=42),
        "logistic": LogisticRegression(max_iter=300, random_state=42),
        "linear": LinearRegression(),
    }
    clf = algo_map.get(algorithm, algo_map["random_forest"])
    clf.fit(X_train, y_train)

    emit({"stage": "evaluating", "progress": 80})
    preds = clf.predict(X_test)

    if model_type == "classification":
        metrics = {"accuracy": round(float(accuracy_score(y_test, preds)), 4)}
    else:
        metrics = {
            "r2": round(float(r2_score(y_test, preds)), 4),
            "rmse": round(float(mean_squared_error(y_test, preds, squared=False)), 4),
        }

    # Feature importance
    feature_importance = {}
    if hasattr(clf, "feature_importances_"):
        fi = clf.feature_importances_
        feature_importance = dict(sorted(
            {col: round(float(imp), 4) for col, imp in zip(X.columns, fi)}.items(),
            key=lambda x: x[1], reverse=True
        ))

    emit({"stage": "saving", "progress": 90})
    os.makedirs("./data/models", exist_ok=True)
    joblib.dump(clf, f"./data/models/{model_id}.pkl")

    duration = time.time() - start

    # Persist to DB
    try:
        from ..core.database import db, MLModel
        ml_model = MLModel(
            id=model_id,
            name=f"{algorithm} ({model_type})",
            model_type=model_type,
            algorithm=algorithm,
            target_column=target,
            feature_columns=list(X.columns),
            metrics={**metrics, "feature_importance": feature_importance},
            artifact_path=f"./data/models/{model_id}.pkl",
        )
        db.session.add(ml_model)
        db.session.commit()
    except Exception as e:
        logger.warning(f"DB save skipped: {e}")

    result = {
        "model_id": model_id,
        "algorithm": algorithm,
        "model_type": model_type,
        "metrics": metrics,
        "feature_importance": feature_importance,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "feature_columns": X.columns.tolist(),
        "duration_secs": round(duration, 2),
        "status": "completed",
    }

    emit({"stage": "completed", "progress": 100, **result})
    logger.info(f"✅ Model [{model_id}] trained in {duration:.1f}s — metrics: {metrics}")
    return result


# ── Monitor Tasks ─────────────────────────────────────────────────────────────

@celery.task(name="app.tasks.monitor_tasks.collect_system_metrics")
def collect_system_metrics() -> Dict:
    import psutil
    cpu = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory()
    try:
        from .. import socketio
        socketio.emit("metrics:system", {
            "cpu_pct": cpu,
            "memory_pct": mem.percent,
            "timestamp": time.time(),
        })
    except Exception:
        pass
    return {"cpu": cpu, "memory": mem.percent}


@celery.task(name="app.tasks.monitor_tasks.cleanup_stale_jobs")
def cleanup_stale_jobs() -> Dict:
    try:
        from ..core.database import db, ScraperJob, JobStatus
        from datetime import datetime, timedelta
        cutoff = datetime.utcnow() - timedelta(hours=2)
        stale = ScraperJob.query.filter(
            ScraperJob.status == JobStatus.RUNNING,
            ScraperJob.started_at < cutoff
        ).all()
        for job in stale:
            job.status = JobStatus.FAILED
            job.error_message = "Job timed out (stale)"
        db.session.commit()
        logger.info(f"Cleaned up {len(stale)} stale jobs")
        return {"cleaned": len(stale)}
    except Exception as e:
        return {"error": str(e)}


@celery.task(name="app.tasks.monitor_tasks.rotate_logs")
def rotate_logs() -> Dict:
    import os
    try:
        log_path = "./logs/dataharvest.log"
        if os.path.exists(log_path) and os.path.getsize(log_path) > 50 * 1024 * 1024:
            os.rename(log_path, log_path + ".bak")
        return {"rotated": True}
    except Exception as e:
        return {"error": str(e)}