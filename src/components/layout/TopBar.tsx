import { useState, useRef, useEffect } from 'react'
import {
  Search, Plus, Download, RefreshCw, MoreHorizontal,
  Sun, Moon, Monitor, Menu, BookOpen, Bell, X,
} from 'lucide-react'
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

  const [docsOpen, setDocsOpen]     = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [moreOpen, setMoreOpen]     = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const moreRef   = useRef<HTMLDivElement>(null)

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme as Theme) + 1) % THEME_CYCLE.length]
    setTheme(next)
    applyTheme(next)
  }

  const ThemeIcon = THEME_ICONS[theme as Theme] ?? Moon

  // Focus search input when mobile search panel opens
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  // Close "more" dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

  return (
    <>
      {/* ── Main header bar ─────────────────────────────────────────────────── */}
      <header
        className="h-14 shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Hamburger — mobile only */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="btn btn-ghost p-2 w-8 h-8 md:hidden shrink-0"
            style={{ color: 'var(--text-2)' }}
            aria-label="Open navigation"
          >
            <Menu size={16} />
          </button>
        )}

        {/* Page title */}
        <div className="min-w-0 flex-shrink">
          <h1
            className="text-[15px] sm:text-[18px] font-bold leading-tight truncate"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
          >
            {title}
          </h1>
          <p
            className="text-[10px] sm:text-[11px] truncate hidden sm:block"
            style={{ color: 'var(--text-3)' }}
          >
            {desc}
          </p>
        </div>

        {/* Desktop search bar */}
        <div className="relative flex-1 max-w-xs hidden md:block">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            className="input pl-8 h-8 text-xs w-full"
            placeholder="Search data, pipelines, models…"
          />
          <kbd
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'var(--surface-el)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
          >
            ⌘K
          </kbd>
        </div>

        <div className="flex-1" />

        {/* Running jobs pill */}
        {running.length > 0 && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0"
            style={{
              background: 'color-mix(in srgb,var(--brand) 10%,transparent)',
              border: '1px solid color-mix(in srgb,var(--brand) 20%,transparent)',
            }}
          >
            <div className="dot dot-blue" />
            <span className="text-xs font-medium" style={{ color: 'var(--brand)' }}>
              {running.length} running
            </span>
          </div>
        )}

        {/* Running jobs — mobile compact dot only */}
        {running.length > 0 && (
          <div
            className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-md shrink-0"
            style={{
              background: 'color-mix(in srgb,var(--brand) 10%,transparent)',
              border: '1px solid color-mix(in srgb,var(--brand) 20%,transparent)',
            }}
            title={`${running.length} running`}
          >
            <div className="dot dot-blue" />
            <span className="text-[10px] font-semibold tabular-nums" style={{ color: 'var(--brand)' }}>
              {running.length}
            </span>
          </div>
        )}

        {/* Mobile: search icon */}
        <button
          onClick={() => setSearchOpen(v => !v)}
          className="btn btn-ghost p-2 w-8 h-8 md:hidden shrink-0"
          style={{ color: 'var(--text-2)' }}
          aria-label="Search"
        >
          <Search size={14} />
        </button>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <button className="btn btn-ghost p-2 w-8 h-8" title="Refresh">
            <RefreshCw size={13} />
          </button>
          <button className="btn btn-ghost p-2 w-8 h-8" title="Download">
            <Download size={13} />
          </button>
          <button
            onClick={() => setDocsOpen(true)}
            title="Documentation"
            className="btn btn-ghost h-8 px-2.5 text-xs flex items-center gap-1.5"
            style={{ color: 'var(--text-2)' }}
          >
            <BookOpen size={13} />
            <span className="hidden lg:inline">Docs</span>
          </button>
          <button className="btn btn-primary h-8 px-3 text-xs">
            <Plus size={13} /> <span className="hidden lg:inline">New</span>
          </button>
        </div>

        {/* Mobile + desktop: "more" dropdown */}
        <div className="relative shrink-0" ref={moreRef}>
          <button
            onClick={() => setMoreOpen(v => !v)}
            className="btn btn-ghost p-2 w-8 h-8"
            title="More options"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={13} />
          </button>

          {moreOpen && (
            <div
              className="absolute right-0 top-10 z-50 min-w-[160px] rounded-xl py-1.5 shadow-lg border animate-scale-in"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Mobile-only items */}
              <button
                onClick={() => { setDocsOpen(true); setMoreOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-[var(--surface-el)] transition-colors sm:hidden"
                style={{ color: 'var(--text-2)' }}
              >
                <BookOpen size={13} /> Docs
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-[var(--surface-el)] transition-colors sm:hidden"
                style={{ color: 'var(--text-2)' }}
              >
                <Plus size={13} /> New Job
              </button>

              <div className="my-1 border-t sm:hidden" style={{ borderColor: 'var(--border)' }} />

              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-[var(--surface-el)] transition-colors"
                style={{ color: 'var(--text-2)' }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-[var(--surface-el)] transition-colors"
                style={{ color: 'var(--text-2)' }}
              >
                <Download size={13} /> Export
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-[var(--surface-el)] transition-colors"
                style={{ color: 'var(--text-2)' }}
              >
                <Bell size={13} /> Notifications
              </button>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${THEME_LABELS[theme as Theme]} — click to change`}
          className="btn btn-ghost p-2 w-8 h-8 shrink-0"
          style={{ color: 'var(--text-2)' }}
        >
          <ThemeIcon size={14} />
        </button>

        {/* Avatar */}
        <div className="pl-2 border-l shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,var(--brand),#8b5cf6)' }}
            title="Hepein Oficial - Brashkie"
          >
            DH
          </div>
        </div>
      </header>

      {/* ── Mobile search expand panel ──────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="md:hidden flex items-center gap-2 px-3 py-2 border-b animate-slide-up"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Search size={13} className="shrink-0" style={{ color: 'var(--text-3)' }} />
          <input
            ref={searchRef}
            className="input h-8 text-xs flex-1"
            placeholder="Search data, pipelines, models…"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="btn btn-ghost p-1.5 w-7 h-7 shrink-0"
            style={{ color: 'var(--text-3)' }}
            aria-label="Close search"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Docs fullscreen overlay ─────────────────────────────────────────── */}
      {docsOpen && <DocsPage onClose={() => setDocsOpen(false)} />}
    </>
  )
}
