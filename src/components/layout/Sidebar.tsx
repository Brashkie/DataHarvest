import {
  LayoutDashboard, Globe, GitBranch, BarChart3, Table2,
  Brain, FileText, Activity, Settings,
  ChevronLeft, ChevronRight, Bell, Moon, Sun, X,
  type LucideIcon,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useStore, type Module } from '#/stores/appStore'

const NAV: { id: Module; label: string; icon: LucideIcon; badge?: string; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard, group: 'main' },
  { id: 'monitor',   label: 'Monitor',     icon: Activity,  badge: 'Live', group: 'main' },
  { id: 'scraper',   label: 'Web Scraper', icon: Globe,     group: 'data' },
  { id: 'pipelines', label: 'Pipelines',   icon: GitBranch, group: 'data' },
  { id: 'tables',    label: 'Data Tables', icon: Table2,    group: 'data' },
  { id: 'analytics', label: 'Analytics',   icon: BarChart3, group: 'analysis' },
  { id: 'ai',        label: 'AI / ML',     icon: Brain,     badge: 'TF',  group: 'analysis' },
  { id: 'reports',   label: 'Reports',     icon: FileText,  group: 'output' },
  { id: 'settings',  label: 'Settings',    icon: Settings,  group: 'system' },
]

const GROUPS = [
  { id: 'main',     label: 'Overview'  },
  { id: 'data',     label: 'Data'      },
  { id: 'analysis', label: 'Analysis'  },
  { id: 'output',   label: 'Output'    },
  { id: 'system',   label: 'System'    },
]

interface SidebarProps {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const {
    module, setModule,
    sidebarCollapsed, toggleSidebar,
    theme, toggleTheme,
    apiConnected, wsConnected,
  } = useStore()

  const handleSetModule = (m: Module) => {
    setModule(m)
    setMobileOpen(false)
  }

  // Mobile drawer always shows full labeled content — icon-only "collapsed" is
  // a desktop density preference, not something a temporary overlay needs.
  const collapsed = sidebarCollapsed && !mobileOpen

  return (
    <>
      {/* Backdrop — CSS-only breakpoint (md:hidden) so there's no SSR/hydration
          flash of the desktop layout on real mobile devices, unlike the old
          window.innerWidth-based isMobile check which defaults to false. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={clsx(
          'flex flex-col h-full border-r transition-transform md:transition-[width] duration-300 shrink-0',
          'fixed inset-y-0 left-0 z-50 w-[210px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:z-auto md:translate-x-0',
          collapsed ? 'md:w-[56px]' : 'md:w-[210px]',
        )}
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
      >
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-2.5 h-14 px-4 border-b shrink-0',
        collapsed && 'justify-center px-0',
      )} style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="relative shrink-0">
          <img src="/dataharvest_logo.svg" alt="DataHarvest" className="w-7 h-7 rounded-lg object-cover" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border"
               style={{ background: apiConnected ? '#10b981' : '#f43f5e',
                        borderColor: 'var(--sidebar-bg)' }} />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white leading-none truncate"
               style={{ fontFamily: 'var(--font-display)' }}>DataHarvest</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--sidebar-text)' }}>Pro v2.0</p>
          </div>
        )}
        <button onClick={() => setMobileOpen(false)}
                className="btn btn-ghost p-1.5 ml-auto shrink-0 md:hidden"
                style={{ color: 'var(--sidebar-text)' }}>
          <X size={16}/>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {GROUPS.map(g => {
          const items = NAV.filter(n => n.group === g.id)
          return (
            <div key={g.id}>
              {!collapsed && (
                <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                   style={{ color: 'rgba(139,159,192,.4)' }}>{g.label}</p>
              )}
              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = item.icon
                  const active = module === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSetModule(item.id)}
                      data-tour={`nav-${item.id}`}
                      className={clsx('nav-item w-full', active && 'active', collapsed && 'justify-center px-0')}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={15} className="shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                  style={{ background: 'rgba(56,189,248,.15)', color: 'var(--brand)' }}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Connection status */}
      {!collapsed && (
        <div
          data-tour="connection-status"
          className="mx-2 mb-2 p-2.5 rounded-lg space-y-1.5"
          style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--sidebar-border)' }}
        >
          <p className="text-[9px] uppercase tracking-widest font-semibold mb-2"
             style={{ color: 'rgba(139,159,192,.5)' }}>Connection</p>
          {[
            { label: 'Flask API', ok: apiConnected },
            { label: 'WebSocket', ok: wsConnected },
          ].map(({ label, ok }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={clsx('dot', ok ? 'dot-green' : 'dot-gray')} />
              <span className="text-[11px]" style={{ color: 'var(--sidebar-text)' }}>{label}</span>
              <span className="text-[10px] ml-auto"
                    style={{ color: ok ? '#10b981' : 'var(--text-3)' }}>
                {ok ? 'OK' : 'Offline'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom controls */}
      <div className={clsx('flex items-center gap-1 p-2 border-t shrink-0', collapsed && 'flex-col')}
           style={{ borderColor: 'var(--sidebar-border)' }}>
        <button onClick={toggleTheme} className="btn btn-ghost p-2 w-8 h-8"
                style={{ color: 'var(--sidebar-text)' }} title="Toggle theme">
          {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
        </button>
        <button className="btn btn-ghost p-2 w-8 h-8"
                style={{ color: 'var(--sidebar-text)' }} title="Notifications">
          <Bell size={14}/>
        </button>
        <div className="flex-1"/>
        <button onClick={toggleSidebar} className="btn btn-ghost p-2 w-8 h-8 hidden md:flex"
                style={{ color: 'var(--sidebar-text)' }} title="Toggle sidebar">
          {sidebarCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
        </button>
      </div>
    </aside>
    </>
  )
}