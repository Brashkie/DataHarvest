/**
 * DataHarvest — React Query hooks
 *
 * Conventions:
 *  - useXxxList  → useQuery  (read, auto-refresh)
 *  - useXxx      → useQuery  (single item)
 *  - useCreateXxx / useUpdateXxx / useDeleteXxx → useMutation
 *  - queryClient exported here and consumed in __root.tsx
 */
// src/hooks/useApi.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  healthApi,
  scraperApi,
  tablesApi,
  analyticsApi,
  pipelinesApi,
  aiApi,
  exportsApi,
  monitorApi,
  getSocket,
} from '#/lib/api'
import { useStore } from '#/stores/appStore'

// ── Shared QueryClient (exported for RouterProvider + __root.tsx) ─────────────
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            2 * 60 * 1000, // 2 min
      retry:                1,
      refetchOnWindowFocus: false,
      refetchOnReconnect:   true,
    },
    mutations: {
      retry: 0,
    },
  },
})

// ── Response unwrapper ────────────────────────────────────────────────────────
// Backend returns { success, data, message } — we strip the envelope
function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScraperJob {
  id:              string
  name:            string
  url:             string
  engine:          string
  status:          string
  progress:        number
  pages_scraped:   number
  rows_extracted:  number
  duration_secs:   number | null
  celery_task_id:  string | null
  error_message:   string | null
  started_at:      string | null
  completed_at:    string | null
  tags:            string[]
  config:          Record<string, unknown>
  created_at:      string
}

export interface ScraperJobsResponse {
  jobs:   ScraperJob[]
  total:  number
  limit:  number
  offset: number
}

export interface JobResults {
  columns:    string[]
  dtypes:     Record<string, string>
  total_rows: number
  rows:       Record<string, unknown>[]
  limit:      number
  offset:     number
}

export interface Dataset {
  id:             string
  name:           string
  description:    string | null
  source_type:    string
  storage_format: string
  row_count:      number
  column_count:   number
  size_bytes:     number
  schema_info:    Record<string, unknown>
  tags:           string[]
  created_at:     string
}

export interface DatasetDetail extends Dataset {
  columns:    string[]
  dtypes:     Record<string, string>
  total_rows: number
  rows:       Record<string, unknown>[]
}

export interface Pipeline {
  id:               string
  name:             string
  description:      string | null
  status:           string
  definition:       Record<string, unknown>
  schedule:         string | null
  run_count:        number
  success_count:    number
  fail_count:       number
  avg_duration_secs: number | null
  last_run_at:      string | null
  tags:             string[]
  created_at:       string
}

export interface MLModel {
  id:               string
  name:             string
  version:          string
  model_type:       string
  algorithm:        string
  metrics:          Record<string, number>
  feature_columns:  string[]
  target_column:    string
  is_deployed:      boolean
  prediction_count: number
  created_at:       string
}

export interface SystemMetrics {
  cpu:     { pct: number; cores: { core: number; pct: number }[]; count: number }
  memory:  { total_gb: number; used_gb: number; available_gb: number; pct: number }
  disk:    { total_gb: number; used_gb: number; free_gb: number; pct: number }
  network: { bytes_sent_mb: number; bytes_recv_mb: number }
  timestamp: number
}

export interface CeleryStats {
  workers:        string[]
  worker_count:   number
  active_tasks:   number
  reserved_tasks: number
}

export interface UrlTestResult {
  url:              string
  reachable:        boolean
  status_code:      number | null
  response_time_ms: number
  content_type:     string
  has_javascript:   boolean
  has_cloudflare:   boolean
  error?:           string
}

export interface DataProfile {
  shape:      { rows: number; columns: number }
  memory_mb:  number
  dtypes:     Record<string, string>
  missing:    { total: number; by_column: Record<string, { count: number; pct: number }> }
  duplicates: { rows: number; pct: number }
  columns:    Record<string, {
    dtype:    string
    count:    number
    missing:  number
    unique:   number
    min?:     number
    max?:     number
    mean?:    number
    median?:  number
    std?:     number
    skewness?: number
    outliers_count?: number
    top_values?: Record<string, number>
  }>
  correlations?: {
    matrix: Record<string, Record<string, number>>
    strong_correlations: { col1: string; col2: string; correlation: number }[]
  }
  outliers?:  Record<string, { count: number; pct: number }>
  patterns?:  {
    email_columns:          string[]
    url_columns:            string[]
    date_columns:           string[]
    id_columns:             string[]
    categorical_columns:    string[]
    high_cardinality_columns: string[]
  }
}

// ── Query keys ─────────────────────────────────────────────────────────────────
// Centralised so invalidations are consistent across mutations

export const QK = {
  health:       ()                      => ['health']                as const,
  scraperJobs:  (p?: Record<string, unknown>) => ['scraper-jobs', p ?? {}] as const,
  scraperJob:   (id: string)            => ['scraper-job', id]      as const,
  jobResults:   (id: string)            => ['job-results', id]      as const,
  jobLogs:      (id: string)            => ['job-logs', id]         as const,
  scraperStats: ()                      => ['scraper-stats']        as const,
  datasets:     ()                      => ['datasets']             as const,
  dataset:      (id: string, lim = 500) => ['dataset', id, lim]    as const,
  pipelines:    ()                      => ['pipelines']            as const,
  pipeline:     (id: string)            => ['pipeline', id]         as const,
  pipelineRuns: (id: string)            => ['pipeline-runs', id]    as const,
  models:       ()                      => ['ml-models']            as const,
  model:        (id: string)            => ['ml-model', id]         as const,
  systemMetrics:()                      => ['system-metrics']       as const,
  celeryStats:  ()                      => ['celery-stats']         as const,
  logs:         ()                      => ['app-logs']             as const,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────────────────────────

export function useHealth() {
  const { setApiConnected } = useStore()
  return useQuery({
    queryKey: QK.health(),
    queryFn:  async () => {
      try {
        const r = await healthApi.check()
        setApiConnected(true)
        return r as { status: string; version: string; system: SystemMetrics['cpu'] }
      } catch (err) {
        setApiConnected(false)
        throw err
      }
    },
    refetchInterval: 15_000,
    retry:           false,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRAPER JOBS
// ─────────────────────────────────────────────────────────────────────────────

/** List all scraper jobs, auto-refresh every 5 s */
export function useScraperJobs(params?: Record<string, unknown>): UseQueryResult<ScraperJobsResponse> {
  return useQuery({
    queryKey: QK.scraperJobs(params),
    queryFn:  async () => unwrap<ScraperJobsResponse>(await scraperApi.listJobs(params)),
    refetchInterval: 5_000,
  })
}

/** Single job, refreshes every 3 s while open */
export function useScraperJob(id: string | null): UseQueryResult<ScraperJob> {
  return useQuery({
    queryKey: QK.scraperJob(id!),
    queryFn:  async () => unwrap<ScraperJob>(await scraperApi.getJob(id!)),
    enabled:         !!id,
    refetchInterval: 3_000,
  })
}

/** Create + queue a scraper job */
export function useCreateJob(): UseMutationResult<
  { job_id: string; celery_task_id: string | null; status: string },
  Error,
  Record<string, unknown>
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => unwrap(await scraperApi.createJob(payload)),
    onSuccess: (data) => {
      toast.success('Scraper job created!')
      qc.invalidateQueries({ queryKey: QK.scraperJobs() })
      // Optimistically add to active jobs in store
      useStore.getState().addJob({
        name:     (data as any).name ?? 'Scraper job',
        type:     'scraper',
        status:   'pending',
        progress: 0,
        url:      (data as any).url,
      })
    },
    onError: (e) => toast.error(e.message),
  })
}

/** Cancel a running job */
export function useCancelJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => scraperApi.cancelJob(id),
    onSuccess: (_, id) => {
      toast.success('Job cancelled')
      qc.invalidateQueries({ queryKey: QK.scraperJobs() })
      qc.invalidateQueries({ queryKey: QK.scraperJob(id) })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Quick URL test (no job created) */
export function useTestUrl(): UseMutationResult<UrlTestResult, Error, { url: string; engine?: string }> {
  return useMutation({
    mutationFn: async ({ url, engine }) =>
      unwrap<UrlTestResult>(await scraperApi.testUrl(url, engine)),
    onError: (e) => toast.error(e.message),
  })
}

/** Fetch scraped results for a completed job */
export function useJobResults(id: string | null, limit = 1000): UseQueryResult<JobResults> {
  return useQuery({
    queryKey: QK.jobResults(id!),
    queryFn:  async () => unwrap<JobResults>(await scraperApi.getResults(id!, limit)),
    enabled:  !!id,
    staleTime: 30_000,
  })
}

/** Fetch job logs */
export function useJobLogs(id: string | null) {
  return useQuery({
    queryKey: QK.jobLogs(id!),
    queryFn:  async () => {
      const r = await scraperApi.getLogs(id!)
      const raw = (r as any)?.data ?? r
      return raw as { level: string; message: string; timestamp: string }[]
    },
    enabled:         !!id,
    refetchInterval: 2_000,
  })
}

/** Scraper-wide stats */
export function useScraperStats() {
  return useQuery({
    queryKey: QK.scraperStats(),
    queryFn:  async () => {
      const r = await scraperApi.getStats()
      return (r as any)?.data ?? r
    },
    refetchInterval: 30_000,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// DATASETS / TABLES
// ─────────────────────────────────────────────────────────────────────────────

/** List all datasets */
export function useDatasets(): UseQueryResult<Dataset[]> {
  return useQuery({
    queryKey: QK.datasets(),
    queryFn:  async () => unwrap<Dataset[]>(await tablesApi.listDatasets()),
  })
}

/** Single dataset with rows */
export function useDataset(id: string | null, limit = 500): UseQueryResult<DatasetDetail> {
  return useQuery({
    queryKey: QK.dataset(id!, limit),
    queryFn:  async () => unwrap<DatasetDetail>(await tablesApi.getDataset(id!, limit)),
    enabled:  !!id,
    staleTime: 60_000,
  })
}

/** Upload a file as a new dataset */
export function useUploadDataset(): UseMutationResult<
  { dataset_id: string; rows: number; columns: string[] },
  Error,
  File
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file) => unwrap(await tablesApi.upload(file)),
    onSuccess: (data) => {
      toast.success(`Uploaded: ${(data as any).rows?.toLocaleString() ?? '?'} rows`)
      qc.invalidateQueries({ queryKey: QK.datasets() })
    },
    onError: (e) => toast.error(e.message),
  })
}

/** Apply transforms to a dataset (filter, groupby, sort, etc.) */
export function useTransformDataset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ops }: { id: string; ops: unknown[] }) =>
      tablesApi.transform(id, ops),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QK.dataset(id) })
      toast.success('Transform applied')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

/** Full EDA profile for a set of rows */
export function useDataProfile(rows: unknown[], enabled = true): UseQueryResult<DataProfile> {
  return useQuery({
    queryKey: ['data-profile', rows.length],
    queryFn:  async () => unwrap<DataProfile>(await analyticsApi.profile({ rows, fast: false })),
    enabled:  enabled && rows.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

/** Pattern detection (email cols, date cols, id cols, etc.) */
export function usePatterns(rows: unknown[]) {
  return useQuery({
    queryKey: ['patterns', rows.length],
    queryFn:  async () => {
      const r = await analyticsApi.patterns({ rows, analyses: ['trends', 'anomalies', 'patterns'] })
      return (r as any)?.data ?? r
    },
    enabled:   rows.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

/** Correlation matrix */
export function useCorrelations(rows: unknown[]) {
  return useQuery({
    queryKey: ['correlations', rows.length],
    queryFn:  async () => {
      const r = await analyticsApi.correlations({ rows })
      return (r as any)?.data ?? r as { columns: string[]; matrix: number[][] }
    },
    enabled:   rows.length > 1,
    staleTime: 5 * 60 * 1000,
  })
}

/** Run a DuckDB SQL query on inline rows */
export function useSqlQuery() {
  return useMutation({
    mutationFn: ({ query, rows }: { query: string; rows: unknown[] }) =>
      analyticsApi.sql({ query, rows }),
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Generate a Plotly chart config from rows */
export function useChart() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => analyticsApi.chart(payload),
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINES
// ─────────────────────────────────────────────────────────────────────────────

/** List all pipelines */
export function usePipelines(): UseQueryResult<Pipeline[]> {
  return useQuery({
    queryKey: QK.pipelines(),
    queryFn:  async () => unwrap<Pipeline[]>(await pipelinesApi.list()),
    refetchInterval: 10_000,
  })
}

/** Create a new pipeline */
export function useCreatePipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      unwrap<Pipeline>(await pipelinesApi.create(payload)),
    onSuccess: () => {
      toast.success('Pipeline created!')
      qc.invalidateQueries({ queryKey: QK.pipelines() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Save pipeline definition (nodes + edges) */
export function useUpdatePipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      pipelinesApi.update(id, payload),
    onSuccess: (_, { id }) => {
      toast.success('Pipeline saved')
      qc.invalidateQueries({ queryKey: QK.pipeline(id) })
      qc.invalidateQueries({ queryKey: QK.pipelines() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Queue a pipeline run via Celery */
export function useRunPipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pipelinesApi.run(id),
    onSuccess: (_, id) => {
      toast.success('Pipeline queued!')
      qc.invalidateQueries({ queryKey: QK.pipelines() })
      qc.invalidateQueries({ queryKey: QK.pipeline(id) })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Delete a pipeline */
export function useDeletePipeline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pipelinesApi.delete(id),
    onSuccess: () => {
      toast.success('Pipeline deleted')
      qc.invalidateQueries({ queryKey: QK.pipelines() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// AI / ML
// ─────────────────────────────────────────────────────────────────────────────

/** List all trained models */
export function useModels(): UseQueryResult<MLModel[]> {
  return useQuery({
    queryKey: QK.models(),
    queryFn:  async () => unwrap<MLModel[]>(await aiApi.listModels()),
  })
}

/** Train a model (Celery task, returns model_id + task_id) */
export function useTrainModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const r = await aiApi.train(payload)
      return (r as any)?.data ?? r
    },
    onSuccess: (data) => {
      const status = (data as any).status
      if (status === 'completed') {
        toast.success(`Model trained! ${JSON.stringify((data as any).metrics ?? {})}`)
      } else {
        toast.success('Training started in background')
      }
      qc.invalidateQueries({ queryKey: QK.models() })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Run predictions against a deployed model */
export function usePredict() {
  return useMutation({
    mutationFn: (payload: { model_id: string; rows: unknown[] }) =>
      aiApi.predict(payload),
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Time-series forecast with Prophet */
export function useForecast() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const r = await aiApi.forecast(payload)
      return (r as any)?.data ?? r
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** K-Means clustering */
export function useCluster() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const r = await aiApi.cluster(payload)
      return (r as any)?.data ?? r
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/** Create an export file and open download */
export function useExport() {
  return useMutation({
    mutationFn: async (payload: { rows: unknown[]; format: string; filename?: string }) => {
      const r = await exportsApi.create(payload)
      return (r as any)?.data ?? r
    },
    onSuccess: (data) => {
      if ((data as any).export_id) {
        window.open(exportsApi.dlUrl((data as any).export_id), '_blank')
      }
      toast.success(`Export ready — ${(data as any).format?.toUpperCase()}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

/** Generate a PDF report */
export function useExportPdf() {
  return useMutation({
    mutationFn: async (payload: { rows: unknown[]; title?: string }) => {
      const r = await exportsApi.pdf(payload)
      return (r as any)?.data ?? r
    },
    onSuccess: (data) => {
      if ((data as any).export_id) {
        window.open(exportsApi.dlUrl((data as any).export_id), '_blank')
      }
      toast.success('PDF report ready!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// MONITOR
// ─────────────────────────────────────────────────────────────────────────────

/** Live system metrics (CPU, memory, disk, network) — polls every 3 s */
export function useSystemMetrics(): UseQueryResult<SystemMetrics> {
  return useQuery({
    queryKey: QK.systemMetrics(),
    queryFn:  async () => {
      const r = await monitorApi.system()
      return (r as any)?.data ?? r as SystemMetrics
    },
    refetchInterval: 3_000,
  })
}

/** Celery worker stats — polls every 8 s */
export function useCeleryStats(): UseQueryResult<CeleryStats> {
  return useQuery({
    queryKey: QK.celeryStats(),
    queryFn:  async () => {
      const r = await monitorApi.celery()
      return (r as any)?.data ?? r as CeleryStats
    },
    refetchInterval: 8_000,
  })
}

/** Application log lines — polls every 5 s */
export function useAppLogs() {
  return useQuery({
    queryKey: QK.logs(),
    queryFn:  async () => {
      const r = await monitorApi.logs()
      const raw = (r as any)?.data ?? r
      return raw as { lines: string[]; total: number }
    },
    refetchInterval: 5_000,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBSOCKET — real-time job progress
// ─────────────────────────────────────────────────────────────────────────────

export interface JobProgressEvent {
  job_id:   string
  status:   string
  progress: number
  stage?:   string
  rows?:    number
  pages?:   number
  error?:   string
  duration_secs?: number
  output_path?:   string
}

/**
 * Subscribe to real-time progress for a single job.
 * Calls `cb` whenever the backend emits a `job:progress` event for `jobId`.
 * Automatically subscribes / unsubscribes on mount / unmount.
 */
export function useJobProgress(
  jobId: string | null,
  cb: (event: JobProgressEvent) => void
) {
  const { setWsConnected } = useStore()
  const cbRef = useRef(cb)
  cbRef.current = cb   // always call latest cb without re-subscribing

  useEffect(() => {
    if (!jobId) return

    const socket = getSocket()

    const onConnect    = () => setWsConnected(true)
    const onDisconnect = () => setWsConnected(false)
    const onProgress   = (event: JobProgressEvent) => {
      if (event.job_id === jobId) cbRef.current(event)
    }

    socket.on('connect',     onConnect)
    socket.on('disconnect',  onDisconnect)
    socket.on('job:progress', onProgress)
    socket.emit('job:subscribe', { job_id: jobId })

    return () => {
      socket.off('connect',     onConnect)
      socket.off('disconnect',  onDisconnect)
      socket.off('job:progress', onProgress)
      socket.emit('job:unsubscribe', { job_id: jobId })
    }
  }, [jobId, setWsConnected])
}

/**
 * Subscribe to all live events (used by MonitorPage).
 * Calls the appropriate `handlers` for each event type.
 */
export function useLiveEvents(handlers: {
  onJobProgress?: (e: JobProgressEvent) => void
  onServerReady?: (e: { status: string; version: string }) => void
  onConnect?:     () => void
  onDisconnect?:  () => void
}) {
  const { setWsConnected } = useStore()
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    const s = getSocket()

    const onConnect    = () => { setWsConnected(true);  ref.current.onConnect?.() }
    const onDisconnect = () => { setWsConnected(false); ref.current.onDisconnect?.() }
    const onProgress   = (e: JobProgressEvent) => ref.current.onJobProgress?.(e)
    const onReady      = (e: { status: string; version: string }) => ref.current.onServerReady?.(e)

    s.on('connect',       onConnect)
    s.on('disconnect',    onDisconnect)
    s.on('job:progress',  onProgress)
    s.on('server:ready',  onReady)

    return () => {
      s.off('connect',      onConnect)
      s.off('disconnect',   onDisconnect)
      s.off('job:progress', onProgress)
      s.off('server:ready', onReady)
    }
  }, [setWsConnected])
}