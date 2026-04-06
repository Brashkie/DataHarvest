import { useState } from 'react'
import { Search, Plus, Download, RefreshCw, MoreHorizontal, Sun, Moon, Monitor, Menu, BookOpen } from 'lucide-react'
import { useStore, type Module, applyTheme, type Theme } from '#/stores/appStore'
import { DocsPage } from '#/pages/doc/DocsPage'

const TITLES: Record<Module, { title: string; desc: string }> = {
  dashboard: { title: 'Dashboard',      desc: 'Overview & real-time metrics' },
  scraper:   { title: 'Web Scraper',    desc: 'Playwright · Selenium · Requests · CloudScraper' },
  pipelines: { title: 'Pipelines',      desc: 'ETL flows · PySpark · Celery' },
  analytics: { title: 'Analytics',      desc: 'Charts · Plotly · Matplotlib' },
  tables:    { title: 'Data Tables',    desc: 'Pandas · Polars · DuckDB SQL' },
  ai:        { title: 'AI / ML Studio', desc: 'TensorFlow · XGBoost · Prophet · Predictions' },
  reports:   { title: 'Reports',        desc: 'Export · Documentation · PDF' },
  monitor:   { title: 'Monitor',        desc: 'Live jobs · CPU · Celery workers · Logs' },
  settings:  { title: 'Settings',       desc: 'Config · Connections · API keys' },
}

const THEME_CYCLE: Theme[] = ['light', 'dark', 'system']
const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor }
const THEME_LABELS = { light: 'Light', dark: 'Dark', system: 'System' }

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { module, activeJobs, theme, setTheme } = useStore()
  const { title, desc } = TITLES[module]
  const running = activeJobs.filter(j => j.status === 'running')

  const [docsOpen, setDocsOpen] = useState(false)

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme as Theme) + 1) % THEME_CYCLE.length]
    setTheme(next)
    applyTheme(next)
  }

  const ThemeIcon = THEME_ICONS[theme as Theme] ?? Moon

  return (
    <>
      <header className="h-14 shrink-0 flex items-center gap-4 px-5 border-b"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

        {/* Botón hamburguesa — solo móvil */}
        {onMenuClick && (
          <button onClick={onMenuClick}
                  className="btn btn-ghost p-2 w-8 h-8 md:hidden"
                  style={{ color: 'var(--text-2)' }}>
            <Menu size={16}/>
          </button>
        )}

        {/* Title */}
        <div className="mr-2 min-w-0">
          <h1 className="text-[18px] font-bold leading-tight truncate"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>
            {title}
          </h1>
          <p className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{desc}</p>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm hidden sm:block">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-3)' }} />
          <input className="input pl-8 h-8 text-xs"
                 placeholder="Search data, pipelines, models…" />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded font-mono"
               style={{ background: 'var(--surface-el)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
            ⌘K
          </kbd>
        </div>

        <div className="flex-1" />

        {/* Running jobs */}
        {running.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
               style={{ background: 'color-mix(in srgb,var(--brand) 10%,transparent)', border: '1px solid color-mix(in srgb,var(--brand) 20%,transparent)' }}>
            <div className="dot dot-blue" />
            <span className="text-xs font-medium" style={{ color: 'var(--brand)' }}>
              {running.length} running
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost p-2 w-8 h-8 hidden sm:flex" title="Refresh">
            <RefreshCw size={13}/>
          </button>
          <button className="btn btn-ghost p-2 w-8 h-8 hidden sm:flex" title="Download">
            <Download size={13}/>
          </button>

          {/* ── Docs button ── */}
          <button
            onClick={() => setDocsOpen(true)}
            title="Documentación"
            className="btn btn-ghost h-8 px-3 text-xs hidden sm:flex items-center gap-1.5"
            style={{ color: 'var(--text-2)' }}
          >
            <BookOpen size={13}/>
            <span>Docs</span>
          </button>

          <button className="btn btn-primary h-8 px-3 text-xs">
            <Plus size={13}/> New
          </button>
          <button className="btn btn-ghost p-2 w-8 h-8" title="More">
            <MoreHorizontal size={13}/>
          </button>
        </div>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${THEME_LABELS[theme as Theme]} — click to change`}
          className="btn btn-ghost p-2 w-8 h-8"
          style={{ color: 'var(--text-2)' }}
        >
          <ThemeIcon size={14}/>
        </button>

        {/* Avatar */}
        <div className="pl-2 border-l" style={{ borderColor: 'var(--border)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
               style={{ background: 'linear-gradient(135deg,var(--brand),#8b5cf6)' }}
               title="Hepein Oficial - Brashkie">
            DH
          </div>
        </div>
      </header>

      {/* Docs fullscreen overlay */}
      {docsOpen && <DocsPage onClose={() => setDocsOpen(false)} />}
    </>
  )
}