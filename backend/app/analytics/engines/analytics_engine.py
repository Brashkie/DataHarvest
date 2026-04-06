"""
DataHarvest — Analytics Engine
Pandas · Polars · NumPy · Matplotlib · Pattern Detection · Auto-EDA
"""
from __future__ import annotations

import json
import io
import base64
import warnings
from typing import Any, Dict, List, Optional, Tuple, Union
from pathlib import Path

import numpy as np
import pandas as pd
import polars as pl
from loguru import logger

warnings.filterwarnings("ignore")


# ── Data Loader ───────────────────────────────────────────────────────────────

class DataLoader:
    """Load datasets from various sources into Pandas / Polars DataFrames."""

    @staticmethod
    def from_file(path: str, engine: str = "pandas", **kwargs) -> Union[pd.DataFrame, pl.DataFrame]:
        """Load CSV, Parquet, JSON, Excel, etc."""
        p = Path(path)
        suffix = p.suffix.lower()

        loaders = {
            ".csv":     (pd.read_csv,     pl.read_csv),
            ".parquet": (pd.read_parquet, pl.read_parquet),
            ".json":    (pd.read_json,    pl.read_json),
            ".jsonl":   (pd.read_json,    pl.read_ndjson),
            ".xlsx":    (pd.read_excel,   None),
            ".xls":     (pd.read_excel,   None),
            ".feather":  (pd.read_feather, pl.read_ipc),
        }

        if suffix not in loaders:
            raise ValueError(f"Unsupported file format: {suffix}")

        pandas_fn, polars_fn = loaders[suffix]

        if engine == "polars" and polars_fn:
            return polars_fn(path, **kwargs)
        return pandas_fn(path, **kwargs)

    @staticmethod
    def from_dict(data: List[Dict]) -> pd.DataFrame:
        return pd.DataFrame(data)

    @staticmethod
    def from_bigquery(query: str, project_id: str) -> pd.DataFrame:
        from google.cloud import bigquery
        client = bigquery.Client(project=project_id)
        return client.query(query).to_dataframe()

    @staticmethod
    def to_polars(df: pd.DataFrame) -> pl.DataFrame:
        return pl.from_pandas(df)

    @staticmethod
    def to_pandas(df: pl.DataFrame) -> pd.DataFrame:
        return df.to_pandas()


# ── Profiler ──────────────────────────────────────────────────────────────────

class DataProfiler:
    """Generate comprehensive data profiles."""

    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.report: Dict[str, Any] = {}

    def profile(self, fast: bool = False) -> Dict[str, Any]:
        """Full EDA profile."""
        df = self.df

        report: Dict[str, Any] = {
            "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
            "memory_mb": round(df.memory_usage(deep=True).sum() / 1_048_576, 2),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "missing": self._missing_report(),
            "duplicates": {
                "rows": int(df.duplicated().sum()),
                "pct": round(df.duplicated().mean() * 100, 2),
            },
            "columns": {},
        }

        for col in df.columns:
            report["columns"][col] = self._column_profile(col, fast=fast)

        if not fast:
            report["correlations"] = self._correlation_report()
            report["outliers"] = self._outlier_report()
            report["patterns"] = self._pattern_report()

        self.report = report
        return report

    def _missing_report(self) -> Dict:
        missing = self.df.isnull().sum()
        pct = (missing / len(self.df) * 100).round(2)
        return {
            "total": int(missing.sum()),
            "by_column": {
                col: {"count": int(count), "pct": float(pct[col])}
                for col, count in missing.items() if count > 0
            },
        }

    def _column_profile(self, col: str, fast: bool = False) -> Dict:
        series = self.df[col]
        dtype = str(series.dtype)
        profile: Dict[str, Any] = {
            "dtype": dtype,
            "count": int(series.count()),
            "missing": int(series.isnull().sum()),
            "unique": int(series.nunique()),
        }

        if pd.api.types.is_numeric_dtype(series):
            stats = series.describe()
            profile.update({
                "min": _safe_json(stats["min"]),
                "max": _safe_json(stats["max"]),
                "mean": _safe_json(stats["mean"]),
                "median": _safe_json(series.median()),
                "std": _safe_json(stats["std"]),
                "q25": _safe_json(stats["25%"]),
                "q75": _safe_json(stats["75%"]),
                "skewness": _safe_json(series.skew()),
                "kurtosis": _safe_json(series.kurt()),
                "zeros": int((series == 0).sum()),
                "negatives": int((series < 0).sum()),
            })
            if not fast:
                q1, q3 = series.quantile(0.25), series.quantile(0.75)
                iqr = q3 - q1
                outliers = series[(series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)]
                profile["outliers_count"] = int(len(outliers))

        elif pd.api.types.is_datetime64_any_dtype(series):
            profile.update({
                "min": str(series.min()),
                "max": str(series.max()),
                "range_days": int((series.max() - series.min()).days) if series.notna().any() else 0,
            })

        else:
            top = series.value_counts().head(5)
            profile.update({
                "top_values": top.to_dict(),
                "avg_length": round(series.dropna().astype(str).str.len().mean(), 1),
            })

        return profile

    def _correlation_report(self) -> Dict:
        numeric = self.df.select_dtypes(include=np.number)
        if numeric.empty or numeric.shape[1] < 2:
            return {}
        corr = numeric.corr().round(3)
        # Find strong correlations
        strong = []
        for i in range(len(corr.columns)):
            for j in range(i + 1, len(corr.columns)):
                val = corr.iloc[i, j]
                if abs(val) > 0.7:
                    strong.append({
                        "col1": corr.columns[i],
                        "col2": corr.columns[j],
                        "correlation": round(float(val), 3),
                    })
        return {
            "matrix": {c: {r: round(float(v), 3) for r, v in row.items()}
                       for c, row in corr.to_dict().items()},
            "strong_correlations": sorted(strong, key=lambda x: abs(x["correlation"]), reverse=True),
        }

    def _outlier_report(self) -> Dict:
        outliers: Dict[str, Any] = {}
        numeric = self.df.select_dtypes(include=np.number)
        for col in numeric.columns:
            s = numeric[col].dropna()
            q1, q3 = s.quantile(0.25), s.quantile(0.75)
            iqr = q3 - q1
            mask = (s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)
            count = int(mask.sum())
            if count > 0:
                outliers[col] = {
                    "count": count,
                    "pct": round(count / len(s) * 100, 2),
                    "lower_bound": _safe_json(q1 - 1.5 * iqr),
                    "upper_bound": _safe_json(q3 + 1.5 * iqr),
                }
        return outliers

    def _pattern_report(self) -> Dict:
        """Detect patterns: dates, emails, URLs, IDs, categoricals."""
        patterns: Dict[str, List] = {
            "email_columns": [],
            "url_columns": [],
            "date_columns": [],
            "id_columns": [],
            "categorical_columns": [],
            "high_cardinality_columns": [],
        }
        for col in self.df.select_dtypes(include="object").columns:
            sample = self.df[col].dropna().astype(str).head(100)
            unique_ratio = self.df[col].nunique() / max(len(self.df[col].dropna()), 1)

            if sample.str.contains(r"@.*\.", regex=True).mean() > 0.5:
                patterns["email_columns"].append(col)
            elif sample.str.contains(r"https?://", regex=True).mean() > 0.5:
                patterns["url_columns"].append(col)
            elif unique_ratio > 0.95:
                patterns["id_columns"].append(col)
            elif unique_ratio < 0.05:
                patterns["categorical_columns"].append(col)
            elif unique_ratio > 0.5:
                patterns["high_cardinality_columns"].append(col)

            # Try date detection
            try:
                pd.to_datetime(sample.head(20), infer_datetime_format=True)
                patterns["date_columns"].append(col)
            except Exception:
                pass

        return patterns


# ── Chart Generator ───────────────────────────────────────────────────────────

class ChartGenerator:
    """Generate charts as base64 images or Plotly JSON."""

    def __init__(self, df: pd.DataFrame):
        self.df = df

    def histogram(self, column: str, bins: int = 30, title: str = "") -> str:
        """Return base64 PNG of histogram."""
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(10, 5))
        ax.hist(self.df[column].dropna(), bins=bins, color="#0ea5e9", edgecolor="none", alpha=0.85)
        ax.set_title(title or f"Distribution of {column}", fontsize=13, fontweight="bold")
        ax.set_xlabel(column)
        ax.set_ylabel("Count")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        plt.tight_layout()
        return self._fig_to_b64(fig)

    def scatter(self, x: str, y: str, color: Optional[str] = None) -> str:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(10, 6))
        if color and color in self.df.columns:
            categories = self.df[color].unique()
            cmap = plt.get_cmap("tab10")
            for i, cat in enumerate(categories[:10]):
                mask = self.df[color] == cat
                ax.scatter(self.df.loc[mask, x], self.df.loc[mask, y],
                          label=str(cat), alpha=0.6, s=20, color=cmap(i / 10))
            ax.legend(fontsize=8)
        else:
            ax.scatter(self.df[x], self.df[y], alpha=0.5, s=15, color="#0ea5e9")
        ax.set_xlabel(x)
        ax.set_ylabel(y)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        plt.tight_layout()
        return self._fig_to_b64(fig)

    def time_series(self, date_col: str, value_col: str) -> str:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        df = self.df[[date_col, value_col]].copy()
        df[date_col] = pd.to_datetime(df[date_col])
        df = df.sort_values(date_col)

        fig, ax = plt.subplots(figsize=(12, 5))
        ax.plot(df[date_col], df[value_col], color="#0ea5e9", linewidth=1.5)
        ax.fill_between(df[date_col], df[value_col], alpha=0.1, color="#0ea5e9")
        ax.set_xlabel("")
        ax.set_ylabel(value_col)
        plt.xticks(rotation=30)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        plt.tight_layout()
        return self._fig_to_b64(fig)

    def to_plotly(self, chart_type: str, **kwargs) -> Dict:
        """Return Plotly figure as JSON dict."""
        import plotly.express as px
        import plotly.graph_objects as go

        chart_map = {
            "histogram":  lambda: px.histogram(self.df, **kwargs),
            "scatter":    lambda: px.scatter(self.df, **kwargs),
            "line":       lambda: px.line(self.df, **kwargs),
            "bar":        lambda: px.bar(self.df, **kwargs),
            "box":        lambda: px.box(self.df, **kwargs),
            "heatmap":    lambda: px.imshow(self.df.select_dtypes(include=np.number).corr(), **kwargs),
            "pie":        lambda: px.pie(self.df, **kwargs),
            "violin":     lambda: px.violin(self.df, **kwargs),
        }
        fn = chart_map.get(chart_type)
        if not fn:
            raise ValueError(f"Unknown chart type: {chart_type}")

        fig = fn()
        fig.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font={"family": "DM Sans, sans-serif", "size": 12},
        )
        return json.loads(fig.to_json())

    def _fig_to_b64(self, fig) -> str:
        import matplotlib.pyplot as plt
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=150, bbox_inches="tight", transparent=True)
        plt.close(fig)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode("utf-8")


# ── Pattern Detector ──────────────────────────────────────────────────────────

class PatternDetector:
    """Detect patterns in data: trends, anomalies, seasonality, clusters."""

    def __init__(self, df: pd.DataFrame):
        self.df = df

    def detect_trends(self, column: str, date_column: Optional[str] = None) -> Dict:
        """Detect trend direction and strength."""
        from scipy import stats

        s = self.df[column].dropna()
        x = np.arange(len(s))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, s)

        return {
            "column": column,
            "trend": "upward" if slope > 0 else "downward",
            "slope": round(float(slope), 6),
            "r_squared": round(float(r_value ** 2), 4),
            "p_value": round(float(p_value), 6),
            "significant": bool(p_value < 0.05),
            "strength": "strong" if abs(r_value) > 0.7 else "moderate" if abs(r_value) > 0.4 else "weak",
        }

    def detect_anomalies(self, column: str, method: str = "iqr") -> Dict:
        """Detect anomalous values using IQR or Z-score."""
        s = self.df[column].dropna()
        anomaly_indices = []

        if method == "iqr":
            q1, q3 = s.quantile(0.25), s.quantile(0.75)
            iqr = q3 - q1
            mask = (s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)
            anomaly_indices = s[mask].index.tolist()

        elif method == "zscore":
            z_scores = np.abs((s - s.mean()) / s.std())
            anomaly_indices = s[z_scores > 3].index.tolist()

        elif method == "isolation_forest":
            from sklearn.ensemble import IsolationForest
            clf = IsolationForest(contamination=0.05, random_state=42)
            preds = clf.fit_predict(s.values.reshape(-1, 1))
            anomaly_indices = s[preds == -1].index.tolist()

        return {
            "column": column,
            "method": method,
            "anomaly_count": len(anomaly_indices),
            "anomaly_pct": round(len(anomaly_indices) / len(s) * 100, 2),
            "anomaly_indices": anomaly_indices[:100],  # cap
            "anomaly_values": s[anomaly_indices[:20]].tolist(),
        }

    def detect_seasonality(self, date_col: str, value_col: str) -> Dict:
        """Detect seasonality patterns."""
        try:
            from statsmodels.tsa.seasonal import seasonal_decompose

            df = self.df[[date_col, value_col]].copy()
            df[date_col] = pd.to_datetime(df[date_col])
            df = df.set_index(date_col).sort_index()
            df = df[value_col].dropna()

            if len(df) < 4:
                return {"error": "Not enough data for seasonality analysis"}

            period = min(12, len(df) // 2)
            decomp = seasonal_decompose(df, model="additive", period=period, extrapolate_trend="freq")

            return {
                "has_trend": bool(decomp.trend.std() > 0.1 * df.std()),
                "has_seasonality": bool(decomp.seasonal.std() > 0.05 * df.std()),
                "seasonal_strength": round(float(decomp.seasonal.std() / df.std()), 4),
                "trend_strength": round(float(decomp.trend.std() / df.std()), 4),
            }
        except Exception as e:
            return {"error": str(e)}

    def cluster_analysis(self, columns: List[str], n_clusters: int = 3) -> Dict:
        """K-Means clustering on numeric columns."""
        from sklearn.cluster import KMeans
        from sklearn.preprocessing import StandardScaler

        data = self.df[columns].dropna()
        scaler = StandardScaler()
        scaled = scaler.fit_transform(data)

        km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = km.fit_predict(scaled)

        return {
            "n_clusters": n_clusters,
            "cluster_sizes": {int(i): int((labels == i).sum()) for i in range(n_clusters)},
            "inertia": round(float(km.inertia_), 4),
            "cluster_centers": km.cluster_centers_.tolist(),
            "columns_used": columns,
        }


# ── Utility ───────────────────────────────────────────────────────────────────

def _safe_json(val: Any) -> Any:
    """Convert numpy scalars to Python native for JSON serialization."""
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return None if np.isnan(val) else float(val)
    return val