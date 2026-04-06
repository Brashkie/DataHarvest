// src/lib/api.ts
import axios, { type AxiosInstance } from 'axios'
import { io, type Socket } from 'socket.io-client'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

/* ── Axios ─────────────────────────────────────────────────────────────────── */
export const api: AxiosInstance = axios.create({
  baseURL: `${BASE}/api/v1`,
  timeout: 60_000,
})

api.interceptors.request.use((cfg) => {
  const tok = localStorage.getItem('dh_token')
  if (tok) cfg.headers.Authorization = `Bearer ${tok}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.error ?? err.message
    if (err.response?.status === 401) {
      localStorage.removeItem('dh_token')
      toast.error('Session expired')
    } else if (err.response?.status >= 500) {
      toast.error(`Server error: ${msg}`)
    }
    return Promise.reject(err)
  }
)

/* ── WebSocket ─────────────────────────────────────────────────────────────── */
let _socket: Socket | null = null

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    })
  }
  return _socket
}

/* ── Typed API namespaces ───────────────────────────────────────────────────── */
const unwrap = (r: { data: unknown }) => r.data

export const healthApi = {
  check: () => api.get('/health/').then(unwrap),
}

export const authApi = {
  login:  (u: string, p: string) => api.post('/auth/login', { username: u, password: p }).then(unwrap),
  me:     ()                      => api.get('/auth/me').then(unwrap),
  logout: ()                      => api.post('/auth/logout').then(unwrap),
}

export const scraperApi = {
  listJobs:   (p?: Record<string, unknown>) => api.get('/scraper/jobs', { params: p }).then(unwrap),
  createJob:  (payload: Record<string, unknown>) => api.post('/scraper/jobs', payload).then(unwrap),
  getJob:     (id: string)                   => api.get(`/scraper/jobs/${id}`).then(unwrap),
  cancelJob:  (id: string)                   => api.delete(`/scraper/jobs/${id}`).then(unwrap),
  getLogs:    (id: string)                   => api.get(`/scraper/jobs/${id}/logs`).then(unwrap),
  getResults: (id: string, limit = 1000)     => api.get(`/scraper/jobs/${id}/results`, { params: { limit } }).then(unwrap),
  testUrl:    (url: string, engine = 'requests') => api.post('/scraper/test-url', { url, engine }).then(unwrap),
  getStats:   ()                             => api.get('/scraper/stats').then(unwrap),
}

export const tablesApi = {
  listDatasets: ()           => api.get('/tables/datasets').then(unwrap),
  getDataset:   (id: string, limit = 500) =>
    api.get(`/tables/datasets/${id}`, { params: { limit } }).then(unwrap),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/tables/datasets/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap)
  },
  transform: (id: string, ops: unknown[]) =>
    api.post(`/tables/datasets/${id}/transform`, { operations: ops }).then(unwrap),
}

export const analyticsApi = {
  profile:      (payload: Record<string, unknown>) => api.post('/analytics/profile', payload).then(unwrap),
  chart:        (payload: Record<string, unknown>) => api.post('/analytics/chart', payload).then(unwrap),
  patterns:     (payload: Record<string, unknown>) => api.post('/analytics/patterns', payload).then(unwrap),
  correlations: (payload: Record<string, unknown>) => api.post('/analytics/correlations', payload).then(unwrap),
  sql:          (payload: Record<string, unknown>) => api.post('/analytics/sql', payload).then(unwrap),
}

export const pipelinesApi = {
  list:   ()                                    => api.get('/pipelines/').then(unwrap),
  create: (payload: Record<string, unknown>)    => api.post('/pipelines/', payload).then(unwrap),
  update: (id: string, payload: Record<string, unknown>) => api.put(`/pipelines/${id}`, payload).then(unwrap),
  run:    (id: string)                          => api.post(`/pipelines/${id}/run`).then(unwrap),
  delete: (id: string)                          => api.delete(`/pipelines/${id}`).then(unwrap),
}

export const aiApi = {
  listModels: ()                                  => api.get('/ai/models').then(unwrap),
  train:      (payload: Record<string, unknown>)  => api.post('/ai/train', payload).then(unwrap),
  predict:    (payload: Record<string, unknown>)  => api.post('/ai/predict', payload).then(unwrap),
  forecast:   (payload: Record<string, unknown>)  => api.post('/ai/forecast', payload).then(unwrap),
  cluster:    (payload: Record<string, unknown>)  => api.post('/ai/cluster', payload).then(unwrap),
}

export const exportsApi = {
  create:  (payload: Record<string, unknown>) => api.post('/exports/', payload).then(unwrap),
  pdf:     (payload: Record<string, unknown>) => api.post('/exports/report/pdf', payload).then(unwrap),
  dlUrl:   (id: string) => `${BASE}/api/v1/exports/${id}/download`,
}

export const monitorApi = {
  system: () => api.get('/monitor/system').then(unwrap),
  celery: () => api.get('/monitor/celery').then(unwrap),
  logs:   () => api.get('/monitor/logs').then(unwrap),
}