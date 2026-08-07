import { Sidebar } from './Sidebar'
import { TopBar }  from './TopBar'
import { useStore, type Module } from '#/stores/appStore'
import { useState, lazy, Suspense } from 'react'
import { TourManager } from '#/components/onboarding/TourManager'

const pages: Record<Module, React.LazyExoticComponent<() => React.ReactElement>> = {
  dashboard: lazy(() => import('#/pages/DashboardPage').then(m => ({ default: m.DashboardPage }))),
  scraper:   lazy(() => import('#/pages/ScraperPage').then(m   => ({ default: m.ScraperPage }))),
  pipelines: lazy(() => import('#/pages/PipelinesPage').then(m => ({ default: m.PipelinesPage }))),
  analytics: lazy(() => import('#/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage }))),
  tables:    lazy(() => import('#/pages/DataTablesPage').then(m => ({ default: m.DataTablesPage }))),
  ai:        lazy(() => import('#/pages/AIStudioPage').then(m  => ({ default: m.AIStudioPage }))),
  reports:   lazy(() => import('#/pages/ReportsPage').then(m   => ({ default: m.ReportsPage }))),
  monitor:   lazy(() => import('#/pages/MonitorPage').then(m   => ({ default: m.MonitorPage }))),
  settings:  lazy(() => import('#/pages/SettingsPage').then(m  => ({ default: m.SettingsPage }))),
}

function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      <div
        className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }}
      />
    </div>
  )
}

export function AppShell() {
  const { module } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const Page = pages[module]

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/*
        .page: flex column, takes remaining width, clips overflow so only
        the inner <main> scrolls — not the whole shell.
      */}
      <div className="page">
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        {/* Scrollable content area — each page controls its own overflow */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Suspense fallback={<PageFallback />}>
            <Page />
          </Suspense>
        </main>
      </div>

      <TourManager />
    </div>
  )
}
