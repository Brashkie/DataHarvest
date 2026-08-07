"""
DataHarvest — Pydantic Schemas (shared request/response models)
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, HttpUrl, field_validator, model_validator
from datetime import datetime
from enum import Enum


# ── Enums ─────────────────────────────────────────────────────────────────────

class EngineEnum(str, Enum):
    auto        = "auto"
    playwright  = "playwright"
    selenium    = "selenium"
    requests    = "requests"
    cloudscraper = "cloudscraper"
    scrapy      = "scrapy"


class FormatEnum(str, Enum):
    csv     = "csv"
    xlsx    = "xlsx"
    json    = "json"
    parquet = "parquet"
    pdf     = "pdf"
    docx    = "docx"


class ModelTypeEnum(str, Enum):
    classification = "classification"
    regression     = "regression"
    clustering     = "clustering"
    anomaly        = "anomaly_detection"
    timeseries     = "time_series"


class AlgorithmEnum(str, Enum):
    random_forest   = "random_forest"
    gradient_boost  = "gradient_boost"
    logistic        = "logistic"
    linear          = "linear"
    xgboost         = "xgboost"
    lightgbm        = "lightgbm"
    lstm            = "lstm"
    prophet         = "prophet"


# ── Scraper Schemas ───────────────────────────────────────────────────────────

class PaginationConfig(BaseModel):
    next_selector: Optional[str] = None
    max_pages: int = 10
    url_pattern: Optional[str] = None
    url_offset_param: Optional[str] = None


class AuthConfig(BaseModel):
    type: str = "basic"           # basic | bearer | cookie | form
    username: Optional[str] = None
    password: Optional[str] = None
    token: Optional[str] = None
    login_url: Optional[str] = None
    login_selectors: Optional[Dict[str, str]] = None


class CreateScraperJobRequest(BaseModel):
    name: str
    url: str
    engine: EngineEnum = EngineEnum.auto
    selectors: Dict[str, str] = {}
    xpath_selectors: Dict[str, str] = {}
    headers: Dict[str, str] = {}
    cookies: Dict[str, str] = {}
    auth: Optional[AuthConfig] = None
    proxy: Optional[str] = None
    timeout: int = 30
    wait_for: Optional[str] = None
    wait_ms: int = 0
    scroll: bool = False
    screenshot: bool = False
    javascript: Optional[str] = None
    pagination: Optional[PaginationConfig] = None
    extract_tables: bool = True
    extract_links: bool = False
    extract_images: bool = False
    extract_metadata: bool = True
    stealth: bool = False
    use_tor: bool = False
    tags: List[str] = []
    schedule: Optional[str] = None

    @field_validator("timeout")
    @classmethod
    def check_timeout(cls, v: int) -> int:
        if v < 5 or v > 300:
            raise ValueError("timeout must be between 5 and 300 seconds")
        return v

    @field_validator("url")
    @classmethod
    def check_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            v = "https://" + v
        return v


# ── Pipeline Schemas ──────────────────────────────────────────────────────────

class NodePosition(BaseModel):
    x: float
    y: float


class PipelineNode(BaseModel):
    id: str
    type: str           # scraper | transform | filter | aggregate | export | ai | notify
    label: str
    position: NodePosition
    data: Dict[str, Any] = {}


class PipelineEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None


class PipelineDefinition(BaseModel):
    nodes: List[PipelineNode] = []
    edges: List[PipelineEdge] = []


class CreatePipelineRequest(BaseModel):
    name: str
    description: Optional[str] = None
    definition: PipelineDefinition = PipelineDefinition()
    schedule: Optional[str] = None
    tags: List[str] = []


# ── Analytics Schemas ─────────────────────────────────────────────────────────

class ProfileRequest(BaseModel):
    dataset_id: Optional[str] = None
    rows: Optional[List[Dict[str, Any]]] = None
    fast: bool = False

    @model_validator(mode="after")
    def check_source(self) -> "ProfileRequest":
        if not self.dataset_id and not self.rows:
            raise ValueError("Provide either dataset_id or rows")
        return self


class ChartRequest(BaseModel):
    rows: List[Dict[str, Any]]
    chart_type: str = "histogram"
    x: Optional[str] = None
    y: Optional[str] = None
    color: Optional[str] = None
    title: Optional[str] = None


class SQLQueryRequest(BaseModel):
    query: str
    rows: List[Dict[str, Any]]
    limit: int = 5000

    @field_validator("query")
    @classmethod
    def sanitize(cls, v: str) -> str:
        forbidden = ["DROP", "DELETE", "TRUNCATE", "ALTER", "INSERT", "UPDATE", "CREATE"]
        upper = v.upper()
        for kw in forbidden:
            if kw in upper:
                raise ValueError(f"Forbidden keyword: {kw}")
        return v


# ── AI Schemas ────────────────────────────────────────────────────────────────

class TrainModelRequest(BaseModel):
    rows: List[Dict[str, Any]]
    target_column: str
    algorithm: AlgorithmEnum = AlgorithmEnum.random_forest
    model_type: ModelTypeEnum = ModelTypeEnum.classification
    feature_columns: List[str] = []
    hyperparams: Dict[str, Any] = {}
    test_size: float = 0.2
    cross_validate: bool = False
    name: Optional[str] = None


class PredictRequest(BaseModel):
    model_id: str
    rows: List[Dict[str, Any]]


class ForecastRequest(BaseModel):
    rows: List[Dict[str, Any]]
    date_column: str
    value_column: str
    periods: int = 30
    frequency: str = "D"   # D=daily, W=weekly, M=monthly


# ── Export Schemas ────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    rows: List[Dict[str, Any]]
    format: FormatEnum = FormatEnum.csv
    filename: Optional[str] = None
    title: Optional[str] = None
    include_index: bool = False
    sheet_name: str = "Data"


# ── Generic ───────────────────────────────────────────────────────────────────

class PaginationParams(BaseModel):
    limit: int = 50
    offset: int = 0
    sort_by: Optional[str] = None
    sort_dir: str = "desc"

    @field_validator("limit")
    @classmethod
    def cap_limit(cls, v: int) -> int:
        return min(v, 1000)