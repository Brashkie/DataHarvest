/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND.
 * Generated from backend Pydantic schemas (app/schemas/requests.py)
 * by scripts/gen-types.mjs. Run `npm run gen:types` to refresh.
 */

export type AlgorithmEnum =
  "random_forest" | "gradient_boost" | "logistic" | "linear" | "xgboost" | "lightgbm" | "lstm" | "prophet";

export interface AuthConfig {
  type?: string;
  username?: string | null;
  password?: string | null;
  token?: string | null;
  login_url?: string | null;
  login_selectors?: {
    [k: string]: string;
  } | null;
}

export interface ChartRequest {
  rows: {}[];
  chart_type?: string;
  x?: string | null;
  y?: string | null;
  color?: string | null;
  title?: string | null;
}

export interface CreatePipelineRequest {
  name: string;
  description?: string | null;
  definition?: PipelineDefinition;
  schedule?: string | null;
  tags?: string[];
}

export interface PipelineDefinition {
  nodes?: PipelineNode[];
  edges?: PipelineEdge[];
}

export interface PipelineNode {
  id: string;
  type: string;
  label: string;
  position: NodePosition;
  data?: {};
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  label?: string | null;
}

export type EngineEnum = "auto" | "playwright" | "selenium" | "requests" | "cloudscraper" | "scrapy";

export interface CreateScraperJobRequest {
  name: string;
  url: string;
  engine?: EngineEnum & string;
  selectors?: {
    [k: string]: string;
  };
  xpath_selectors?: {
    [k: string]: string;
  };
  headers?: {
    [k: string]: string;
  };
  cookies?: {
    [k: string]: string;
  };
  auth?: AuthConfig | null;
  proxy?: string | null;
  timeout?: number;
  wait_for?: string | null;
  wait_ms?: number;
  scroll?: boolean;
  screenshot?: boolean;
  javascript?: string | null;
  pagination?: PaginationConfig | null;
  extract_tables?: boolean;
  extract_links?: boolean;
  extract_images?: boolean;
  extract_metadata?: boolean;
  stealth?: boolean;
  use_tor?: boolean;
  tags?: string[];
  schedule?: string | null;
}

export interface PaginationConfig {
  next_selector?: string | null;
  max_pages?: number;
  url_pattern?: string | null;
  url_offset_param?: string | null;
}

export type FormatEnum = "csv" | "xlsx" | "json" | "parquet" | "pdf" | "docx";

export interface ExportRequest {
  rows: {}[];
  format?: FormatEnum & string;
  filename?: string | null;
  title?: string | null;
  include_index?: boolean;
  sheet_name?: string;
}

export interface ForecastRequest {
  rows: {}[];
  date_column: string;
  value_column: string;
  periods?: number;
  frequency?: string;
}

export type ModelTypeEnum = "classification" | "regression" | "clustering" | "anomaly_detection" | "time_series";

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sort_by?: string | null;
  sort_dir?: string;
}

export interface PredictRequest {
  model_id: string;
  rows: {}[];
}

export interface ProfileRequest {
  dataset_id?: string | null;
  rows?: {}[] | null;
  fast?: boolean;
}

export interface SQLQueryRequest {
  query: string;
  rows: {}[];
  limit?: number;
}

export interface TrainModelRequest {
  rows: {}[];
  target_column: string;
  algorithm?: AlgorithmEnum & string;
  model_type?: ModelTypeEnum & string;
  feature_columns?: string[];
  hyperparams?: {};
  test_size?: number;
  cross_validate?: boolean;
  name?: string | null;
}

