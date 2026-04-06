"""DataHarvest — AI/ML Blueprint"""
from flask import Blueprint, request, jsonify
import pandas as pd, numpy as np
from loguru import logger

ai_bp = Blueprint("ai", __name__)
def _ok(d=None, s=200): return jsonify({"success": True, "data": d}), s
def _err(m, s=400): return jsonify({"success": False, "error": m}), s


@ai_bp.get("/models")
def list_models():
    try:
        from ..core.database import MLModel
        models = MLModel.query.order_by(MLModel.created_at.desc()).all()
        return _ok([m.to_dict() for m in models])
    except Exception:
        return _ok(_demo_models())


@ai_bp.post("/train")
def train_model():
    data = request.get_json(silent=True) or {}
    rows = data.get("rows", [])
    target = data.get("target_column")
    algorithm = data.get("algorithm", "random_forest")
    model_type = data.get("model_type", "classification")
    feature_cols = data.get("feature_columns", [])

    if not rows or not target:
        return _err("rows and target_column required")

    try:
        from ..tasks.ai_tasks import train_model_task
        import uuid
        model_id = str(uuid.uuid4())
        task = train_model_task.apply_async(args=[model_id, rows, target, algorithm, model_type, feature_cols], queue="ai")
        return _ok({"model_id": model_id, "task_id": task.id, "status": "training"})
    except Exception:
        # Inline quick training for demo
        return _quick_train(rows, target, algorithm, model_type, feature_cols)


@ai_bp.post("/predict")
def predict():
    data = request.get_json(silent=True) or {}
    model_id = data.get("model_id")
    rows = data.get("rows", [])

    if not model_id or not rows:
        return _err("model_id and rows required")

    try:
        import joblib, os
        model_path = f"./data/models/{model_id}.pkl"
        if not os.path.exists(model_path):
            return _err("Model not found")
        model = joblib.load(model_path)
        df = pd.DataFrame(rows)
        preds = model.predict(df.select_dtypes(include=np.number))
        return _ok({"predictions": preds.tolist(), "count": len(preds)})
    except Exception as e:
        return _err(str(e))


@ai_bp.post("/forecast")
def forecast():
    """Time-series forecasting with Prophet."""
    data = request.get_json(silent=True) or {}
    rows = data.get("rows", [])
    date_col = data.get("date_column")
    value_col = data.get("value_column")
    periods = int(data.get("periods", 30))

    try:
        from prophet import Prophet
        df = pd.DataFrame(rows)
        df_prophet = df[[date_col, value_col]].rename(columns={date_col: "ds", value_col: "y"})
        df_prophet["ds"] = pd.to_datetime(df_prophet["ds"])
        df_prophet["y"] = pd.to_numeric(df_prophet["y"], errors="coerce")
        df_prophet = df_prophet.dropna()

        m = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
        m.fit(df_prophet)
        future = m.make_future_dataframe(periods=periods)
        forecast_df = m.predict(future)

        return _ok({
            "forecast": forecast_df[["ds","yhat","yhat_lower","yhat_upper"]].tail(periods).assign(
                ds=lambda x: x["ds"].astype(str)
            ).to_dict("records"),
            "periods": periods,
        })
    except Exception as e:
        return _err(str(e))


@ai_bp.post("/cluster")
def cluster():
    data = request.get_json(silent=True) or {}
    rows = data.get("rows", [])
    n_clusters = int(data.get("n_clusters", 3))
    columns = data.get("columns")

    try:
        from ..analytics.engines.analytics_engine import PatternDetector
        df = pd.DataFrame(rows)
        cols = columns or df.select_dtypes(include=np.number).columns.tolist()
        detector = PatternDetector(df)
        result = detector.cluster_analysis(cols, n_clusters=n_clusters)
        return _ok(result)
    except Exception as e:
        return _err(str(e))


def _quick_train(rows, target, algorithm, model_type, feature_cols):
    """Quick inline training — sklearn only."""
    try:
        from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier
        from sklearn.linear_model import LogisticRegression, LinearRegression
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, r2_score, mean_squared_error
        from sklearn.preprocessing import LabelEncoder
        import uuid, joblib, os

        df = pd.DataFrame(rows)
        X = df[feature_cols] if feature_cols else df.select_dtypes(include=np.number).drop(columns=[target], errors="ignore")
        y = df[target]

        if model_type == "classification" and y.dtype == "object":
            le = LabelEncoder()
            y = le.fit_transform(y)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        algo_map = {
            "random_forest": RandomForestClassifier(n_estimators=50, random_state=42)
                if model_type == "classification" else RandomForestRegressor(n_estimators=50, random_state=42),
            "logistic": LogisticRegression(max_iter=200),
            "linear": LinearRegression(),
            "gradient_boost": GradientBoostingClassifier(n_estimators=50, random_state=42),
        }
        clf = algo_map.get(algorithm, algo_map["random_forest"])
        clf.fit(X_train, y_train)

        preds = clf.predict(X_test)
        if model_type == "classification":
            metrics = {"accuracy": round(float(accuracy_score(y_test, preds)), 4)}
        else:
            metrics = {"r2": round(float(r2_score(y_test, preds)), 4),
                       "rmse": round(float(mean_squared_error(y_test, preds, squared=False)), 4)}

        model_id = str(uuid.uuid4())
        os.makedirs("./data/models", exist_ok=True)
        joblib.dump(clf, f"./data/models/{model_id}.pkl")

        return jsonify({"success": True, "data": {
            "model_id": model_id,
            "algorithm": algorithm,
            "model_type": model_type,
            "metrics": metrics,
            "feature_columns": X.columns.tolist(),
            "target_column": target,
            "training_samples": len(X_train),
            "status": "completed",
        }}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


def _demo_models():
    return [
        {"id":"ml-1","name":"Price Predictor","model_type":"regression",
         "algorithm":"RandomForest","metrics":{"r2":0.91,"rmse":12.4},"is_deployed":True},
        {"id":"ml-2","name":"Category Classifier","model_type":"classification",
         "algorithm":"GradientBoosting","metrics":{"accuracy":0.87},"is_deployed":False},
    ]