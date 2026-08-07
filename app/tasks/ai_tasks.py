"""DataHarvest — AI/ML Celery Tasks"""
from __future__ import annotations
from ..core.celery_app import celery
from loguru import logger


@celery.task(bind=True, name="app.tasks.ai_tasks.train_model_task")
def train_model_task(self, model_id: str, rows: list, target: str,
                     algorithm: str, model_type: str, feature_cols: list):
    logger.info(f"▶ Training model [{model_id}] algo={algorithm}")
    import pandas as pd, numpy as np, joblib, os
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression, LinearRegression
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, r2_score, mean_squared_error
    from sklearn.preprocessing import LabelEncoder

    df = pd.DataFrame(rows)
    X = df[feature_cols] if feature_cols else df.select_dtypes(include=np.number).drop(columns=[target], errors="ignore")
    y = df[target]

    if model_type == "classification" and y.dtype == "object":
        le = LabelEncoder()
        y = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    algo_map = {
        "random_forest": RandomForestClassifier(n_estimators=100, random_state=42)
            if model_type == "classification" else RandomForestRegressor(n_estimators=100, random_state=42),
        "logistic": LogisticRegression(max_iter=500),
        "linear": LinearRegression(),
        "gradient_boost": GradientBoostingClassifier(n_estimators=100, random_state=42),
    }
    clf = algo_map.get(algorithm, algo_map["random_forest"])
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)

    if model_type == "classification":
        metrics = {"accuracy": round(float(accuracy_score(y_test, preds)), 4)}
    else:
        metrics = {
            "r2": round(float(r2_score(y_test, preds)), 4),
            "rmse": round(float(mean_squared_error(y_test, preds, squared=False)), 4),
        }

    os.makedirs("./data/models", exist_ok=True)
    joblib.dump(clf, f"./data/models/{model_id}.pkl")

    # Persist to DB
    try:
        from ..core.database import db, MLModel
        import datetime
        m = MLModel(
            id=model_id, name=f"Model-{model_id[:8]}",
            model_type=model_type, algorithm=algorithm,
            feature_columns=X.columns.tolist(), target_column=target,
            metrics=metrics, artifact_path=f"./data/models/{model_id}.pkl",
        )
        db.session.add(m); db.session.commit()
    except Exception as e:
        logger.warning(f"DB persist skipped: {e}")

    logger.info(f"✅ Model [{model_id}] trained — {metrics}")
    return {"model_id": model_id, "metrics": metrics, "status": "completed"}