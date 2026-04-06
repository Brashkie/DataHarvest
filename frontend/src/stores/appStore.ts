/**
 * DataHarvest — Global App Store
 * Zustand 5 + Immer + persist middleware
 *
 * Persisted keys (localStorage "dh-store"):
 *   theme · sidebarCollapsed · backendUrl
 *
 * Ephemeral (reset on page refresh):
 *   module · apiConnected · wsConnected · activeJobs · notifications · openPanels
 */
// src/stores/appStore.ts
import { create } from 'zustand'
import { persist }   from 'zustand/middleware'
import { immer }     from 'zustand/middleware/immer'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light' | 'system'

export type Module =
  | 'dashboard'
  | 'scraper'
  | 'pipelines'
  | 'analytics'
  | 'tables'
  | 'ai'
  | 'reports'
  | 'monitor'
  | 'settings'

export type JobStatus = 'pending' | 'running' | 'completed' | 'error' | 'paused' | 'cancelled'

export interface ActiveJob {
  id:       string
  name:     string
  type:     'scraper' | 'pipeline' | 'export' | 'ai' | 'analysis'
  status:   JobStatus
  progress: number          // 0–100
  url?:     string          // for scraper jobs
  startedAt: string         // ISO timestamp
  meta?:    Record<string, unknown>
}

export type NotifType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id:        string
  type:      NotifType
  title:     string
  message:   string
  timestamp: string
  read:      boolean
  jobId?:    string         // link to related job
}

export interface AppState {
  // ── Persisted ──────────────────────────────────────────────────────────────
  theme:            Theme
  sidebarCollapsed: boolean
  backendUrl:       string

  // ── Ephemeral ──────────────────────────────────────────────────────────────
  module:           Module
  apiConnected:     boolean
  wsConnected:      boolean
  activeJobs:       ActiveJob[]
  notifications:    Notification[]
  unreadCount:      number
  // panel state — which dataset / job is selected in each module
  selectedDatasetId: string | null
  selectedJobId:     string | null
  selectedModelId:   string | null

  // ── Theme ──────────────────────────────────────────────────────────────────
  setTheme:    (t: Theme)  => void
  toggleTheme: ()          => void

  // ── Navigation ─────────────────────────────────────────────────────────────
  setModule:       (m: Module) => void
  toggleSidebar:   ()          => void

  // ── Connection ─────────────────────────────────────────────────────────────
  setApiConnected: (v: boolean) => void
  setWsConnected:  (v: boolean) => void
  setBackendUrl:   (url: string) => void

  // ── Active Jobs ────────────────────────────────────────────────────────────
  addJob:    (job: Omit<ActiveJob, 'id' | 'startedAt'>) => string
  updateJob: (id: string, patch: Partial<Omit<ActiveJob, 'id'>>) => void
  removeJob: (id: string) => void
  clearJobs: () => void

  // ── Notifications ──────────────────────────────────────────────────────────
  addNotification:     (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAllRead:         () => void
  clearNotifications:  () => void

  // ── Panel selections ───────────────────────────────────────────────────────
  selectDataset: (id: string | null) => void
  selectJob:     (id: string | null) => void
  selectModel:   (id: string | null) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<AppState>()(
  persist(
    immer((set) => ({
      // ── Initial state ───────────────────────────────────────────────────────
      theme:             'dark',
      sidebarCollapsed:  false,
      backendUrl:        'http://localhost:5000',
      module:            'dashboard',
      apiConnected:      false,
      wsConnected:       false,
      activeJobs:        [],
      notifications:     [],
      unreadCount:       0,
      selectedDatasetId: null,
      selectedJobId:     null,
      selectedModelId:   null,

      // ── Theme ────────────────────────────────────────────────────────────────
      setTheme: (t) => set((s) => {
        s.theme = t
        applyTheme(t)
      }),

      toggleTheme: () => set((s) => {
        const order: Theme[] = ['dark', 'light', 'system']
        const next = order[(order.indexOf(s.theme) + 1) % order.length]
        s.theme = next
        applyTheme(next)
      }),

      // ── Navigation ───────────────────────────────────────────────────────────
      setModule: (m) => set((s) => {
        s.module = m
      }),

      toggleSidebar: () => set((s) => {
        s.sidebarCollapsed = !s.sidebarCollapsed
      }),

      // ── Connection ───────────────────────────────────────────────────────────
      setApiConnected: (v) => set((s) => { s.apiConnected = v }),
      setWsConnected:  (v) => set((s) => { s.wsConnected  = v }),
      setBackendUrl:   (u) => set((s) => { s.backendUrl   = u }),

      // ── Active Jobs ──────────────────────────────────────────────────────────
      addJob: (job) => {
        const id = crypto.randomUUID()
        set((s) => {
          s.activeJobs.push({
            ...job,
            id,
            startedAt: new Date().toISOString(),
          })
        })
        return id
      },

      updateJob: (id, patch) => set((s) => {
        const job = s.activeJobs.find(j => j.id === id)
        if (job) Object.assign(job, patch)
      }),

      removeJob: (id) => set((s) => {
        s.activeJobs = s.activeJobs.filter(j => j.id !== id)
      }),

      clearJobs: () => set((s) => {
        s.activeJobs = s.activeJobs.filter(j => j.status === 'running')
      }),

      // ── Notifications ─────────────────────────────────────────────────────────
      addNotification: (n) => set((s) => {
        const notif: Notification = {
          ...n,
          id:        crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read:      false,
        }
        s.notifications.unshift(notif)
        s.unreadCount += 1
        // cap at 50
        if (s.notifications.length > 50) {
          s.notifications = s.notifications.slice(0, 50)
        }
      }),

      markAllRead: () => set((s) => {
        s.notifications.forEach(n => { n.read = true })
        s.unreadCount = 0
      }),

      clearNotifications: () => set((s) => {
        s.notifications = []
        s.unreadCount   = 0
      }),

      // ── Panel selections ──────────────────────────────────────────────────────
      selectDataset: (id) => set((s) => { s.selectedDatasetId = id }),
      selectJob:     (id) => set((s) => { s.selectedJobId     = id }),
      selectModel:   (id) => set((s) => { s.selectedModelId   = id }),
    })),
    {
      name: 'dh-store',
      skipHydration: true,
      // Only persist UI preferences — not ephemeral state
      partialize: (s) => ({
        theme:            s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        backendUrl:       s.backendUrl,
      }),
    }
  )
)

export function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
  document.documentElement.classList.remove('dark', 'light')
  document.documentElement.classList.add(resolved)
  document.documentElement.style.colorScheme = resolved
}

// ── Selectors ─────────────────────────────────────────────────────────────────
// Use these for derived state to avoid subscribing to the whole store

export const useTheme         = () => useStore(s => s.theme)
export const useModule        = () => useStore(s => s.module)
export const useApiConnected  = () => useStore(s => s.apiConnected)
export const useWsConnected   = () => useStore(s => s.wsConnected)
export const useBackendUrl    = () => useStore(s => s.backendUrl)
export const useActiveJobs    = () => useStore(s => s.activeJobs)
export const useRunningJobs   = () => useStore(s => s.activeJobs.filter(j => j.status === 'running'))
export const useNotifications = () => useStore(s => s.notifications)
export const useUnreadCount   = () => useStore(s => s.unreadCount)