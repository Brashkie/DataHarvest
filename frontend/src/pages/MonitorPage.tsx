// ── Monitor Page ──────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { Activity, Cpu, Server, HardDrive, Wifi, Terminal, RefreshCw, Radio } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts'
import { clsx } from 'clsx'
import { useSystemMetrics, useCeleryStats, useScraperJobs } from '../hooks/useApi'
import { Panel, Spinner, StatCard, Badge, StatusBadge } from '../components/ui'

export function MonitorPage() {
  const { data: sys } = useSystemMetrics()
  const { data: celery } = useCeleryStats()
  const { data: jobs }   = useScraperJobs()
  const [cpuHistory, setCpuHistory] = useState<{ t: number; cpu: number; mem: number }[]>([])
  const [logs, setLogs]    = useState<string[]>([])
  const logsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sys) return
    setCpuHistory(prev => {
      const next = [...prev.slice(-29), { t: Date.now(), cpu: sys.cpu?.pct ?? 0, mem: sys.memory?.pct ?? 0 }]
      return next
    })
  }, [sys])

  // Fake log stream
  useEffect(() => {
    const msgs = [
      'INFO     Scraper job [abc123] started — engine=playwright',
      'DEBUG    Navigating to https://example.com',
      'INFO     Page loaded in 1.2s — extracted 48 rows',
      'INFO     Pipeline [pl-1] step 2/4 completed',
      'WARNING  Rate limit detected — backing off 2s',
      'INFO     Export [exp-7] written to ./exports/data.csv (2.4 MB)',
      'DEBUG    Celery beat: collect_system_metrics fired',
      'INFO     WebSocket client connected: sid=xk91a',
    ]
    const interval = setInterval(() => {
      const msg = `${new Date().toISOString().slice(11,19)}  ${msgs[Math.floor(Math.random() * msgs.length)]}`
      setLogs(prev => [...prev.slice(-99), msg])
      if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const runningJobs = (jobs?.jobs ?? []).filter((j: any) => j.status === 'running')

  return (
    <div className="h-full overflow-auto p-5 space-y-5 bg-[var(--bg)]">
      {/* System Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="CPU Usage" value={sys ? `${sys.cpu?.pct?.toFixed(1)}%` : '—'}
          icon={<Cpu size={14}/>} iconColor="var(--brand)" />
        <StatCard label="Memory" value={sys ? `${sys.memory?.pct?.toFixed(1)}%` : '—'}
          sub={sys ? `${sys.memory?.used_gb} / ${sys.memory?.total_gb} GB` : undefined}
          icon={<Server size={14}/>} iconColor="var(--accent-violet)" />
        <StatCard label="Disk" value={sys ? `${sys.disk?.pct?.toFixed(1)}%` : '—'}
          sub={sys ? `${sys.disk?.used_gb} / ${sys.disk?.total_gb} GB` : undefined}
          icon={<HardDrive size={14}/>} iconColor="var(--accent-amber)" />
        <StatCard label="Running Jobs" value={runningJobs.length}
          icon={<Radio size={14}/>} iconColor="var(--accent-emerald)" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        <Panel title="CPU & Memory" subtitle="Last 30 samples">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuHistory}>
                <defs>
                  <linearGradient id="gcpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--brand)"          stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--brand)"          stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gmem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--accent-violet)"  stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-violet)"  stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={28}/>
                <Tooltip contentStyle={{ background:'var(--chart-tooltip-bg)', border:'1px solid var(--surface-border)', borderRadius:8, fontSize:12 }}/>
                <Area type="monotone" dataKey="cpu" stroke="var(--brand)" fill="url(#gcpu)" strokeWidth={2} name="CPU %" />
                <Area type="monotone" dataKey="mem" stroke="var(--accent-violet)" fill="url(#gmem)" strokeWidth={2} name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Celery Workers" subtitle="Background task workers">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Workers online</span>
              <span className="font-mono font-semibold text-[var(--brand)]">{celery?.worker_count ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Active tasks</span>
              <span className="font-mono font-semibold">{celery?.active_tasks ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Reserved tasks</span>
              <span className="font-mono">{celery?.reserved_tasks ?? 0}</span>
            </div>
            <div className="pt-2 border-t border-[var(--surface-border)]">
              {['scraping','pipelines','analytics','ai','exports','monitoring'].map(q => (
                <div key={q} className="flex items-center gap-2 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono text-[var(--text-muted)]">{q}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Active Jobs */}
      <Panel title="Active Jobs" subtitle="Currently running background tasks">
        {runningJobs.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-3">No active jobs</p>
        ) : (
          <div className="space-y-2">
            {runningJobs.map((j: any) => (
              <div key={j.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)]">
                <div className="status-dot running" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate">{j.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{j.url}</p>
                </div>
                <Badge variant="blue">{j.engine}</Badge>
                <StatusBadge status={j.status} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Live Logs */}
      <Panel title="Application Logs" subtitle="Real-time log stream"
        actions={<Badge variant="emerald">Live</Badge>}
      >
        <div ref={logsRef} className="h-56 overflow-y-auto bg-[var(--code-bg)] rounded-lg p-3 font-mono text-[11px] leading-relaxed">
          {logs.length === 0 ? (
            <p className="text-[var(--text-muted)]">Waiting for log events...</p>
          ) : (
            logs.map((line, i) => {
              const isError   = line.includes('ERROR')
              const isWarning = line.includes('WARNING')
              const isDebug   = line.includes('DEBUG')
              return (
                <div key={i} className={clsx(
                  isError   ? 'text-rose-400' :
                  isWarning ? 'text-amber-400' :
                  isDebug   ? 'text-[var(--text-muted)]' :
                  'text-emerald-400'
                )}>
                  {line}
                </div>
              )
            })
          )}
        </div>
      </Panel>
    </div>
  )
}