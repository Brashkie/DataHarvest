import { useState, useEffect } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Globe, Brain, GitBranch, BarChart3,
  ArrowUpRight, CheckCircle2, Clock,
  Activity, Database, Radio,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useStore } from '#/stores/appStore'
import { useSystemMetrics } from '#/hooks/useApi'
import { StatCard, StatusBadge, Badge } from '#/components/ui'

const mkScrapeData = () =>
  Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    rows:   Math.floor(Math.random() * 5000 + 400),
    errors: Math.floor(Math.random() * 30),
  }))

const mkCpuHistory = () =>
  Array.from({ length: 20 }, (_, i) => ({
    t:   i,
    cpu: Math.floor(Math.random() * 45 + 15),
    mem: Math.floor(Math.random() * 25 + 45),
  }))

const PIE_DATA = [
  { name: 'Completed', value: 38, color: '#10b981' },
  { name: 'Running',   value: 5,  color: '#38bdf8' },
  { name: 'Failed',    value: 3,  color: '#f43f5e' },
  { name: 'Paused',    value: 8,  color: '#f59e0b' },
]

const RECENT_JOBS = [
  { id: '1', name: 'E-commerce Prices',    engine: 'playwright',   status: 'completed', rows: 2840, dur: '2m 14s', ago: '3m ago'  },
  { id: '2', name: 'News Aggregator',      engine: 'requests',     status: 'running',   rows: 340,  dur: '—',      ago: 'now'     },
  { id: '3', name: 'LinkedIn Profiles',    engine: 'playwright',   status: 'completed', rows: 180,  dur: '4m 55s', ago: '18m ago' },
  { id: '4', name: 'Stock Data Feed',      engine: 'cloudscraper', status: 'failed',    rows: 0,    dur: '0s',     ago: '1h ago'  },
  { id: '5', name: 'Real Estate Listings', engine: 'selenium',     status: 'completed', rows: 920,  dur: '6m 02s', ago: '2h ago'  },
]

const ENGINE_ICON: Record<string, string> = {
  playwright:   '🎭',
  requests:     '⚡',
  selenium:     '🔧',
  cloudscraper: '☁️',
  scrapy:       '🕷️',
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-xl"
         style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--border)' }}>
      <p className="mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} className="font-medium" style={{ color: e.color }}>
          {e.name}: {e.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { setModule } = useStore()
  const [scrapeData]  = useState(mkScrapeData)
  const [cpuHistory, setCpuHistory] = useState(mkCpuHistory)
  const { data: sysData } = useSystemMetrics()

  useEffect(() => {
    const id = setInterval(() => {
      setCpuHistory(prev => [
        ...prev.slice(1),
        {
          t:   prev.length,
          cpu: sysData?.cpu?.pct ?? Math.floor(Math.random() * 40 + 15),
          mem: sysData?.memory?.pct ?? Math.floor(Math.random() * 25 + 45),
        },
      ])
    }, 3000)
    return () => clearInterval(id)
  }, [sysData])

  const totalRows  = RECENT_JOBS.reduce((s, j) => s + j.rows, 0)
  const successPct = Math.round((PIE_DATA[0].value / PIE_DATA.reduce((a, b) => a + b.value, 0)) * 100)

  return (
    <div className="h-full overflow-auto" style={{ background: 'var(--bg)' }}>
      <div className="p-5 space-y-5 animate-[fade-in_.3s_ease-in-out]">

        {/* KPI row */}
        <div data-tour="kpi-cards" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Rows Harvested"
            value={totalRows.toLocaleString()}
            delta="12.4%" positive
            icon={<Database size={14}/>}
          />
          <StatCard
            label="Active Jobs"
            value={RECENT_JOBS.filter(j => j.status === 'running').length}
            sub="right now"
            icon={<Radio size={14}/>}
            iconColor="var(--color-accent-emerald)"
          />
          <StatCard
            label="Success Rate"
            value={`${successPct}%`}
            delta="2.1%" positive
            icon={<CheckCircle2 size={14}/>}
            iconColor="#10b981"
          />
          <StatCard
            label="Avg Duration"
            value="3m 42s"
            sub="per completed job"
            icon={<Clock size={14}/>}
            iconColor="var(--color-accent-amber)"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Rows harvested */}
          <div data-tour="chart-rows" className="panel lg:col-span-2">
            <div className="panel-header">
              <div>
                <p className="panel-title">Rows Harvested — 24h</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>Hourly extraction volume</p>
              </div>
              <Badge variant="blue">Live</Badge>
            </div>
            <div className="p-4" style={{ height: 192 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scrapeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRows" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)"/>
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} interval={3}/>
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} width={36}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Area type="monotone" dataKey="rows"   name="Rows"   stroke="#38bdf8" fill="url(#gRows)" strokeWidth={2}/>
                  <Area type="monotone" dataKey="errors" name="Errors" stroke="#f43f5e" fill="url(#gErr)"  strokeWidth={1.5}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pipeline status pie */}
          <div className="panel">
            <div className="panel-header">
              <p className="panel-title">Pipeline Status</p>
            </div>
            <div className="p-4">
              <div style={{ height: 144 }} className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={42} outerRadius={62}
                         paddingAngle={3} dataKey="value">
                      {PIE_DATA.map(({ color }, i) => <Cell key={i} fill={color} stroke="none"/>)}
                    </Pie>
                    <Tooltip contentStyle={{
                      background: 'var(--tooltip-bg)', border: '1px solid var(--border)',
                      borderRadius: 8, fontSize: 12,
                    }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-1">
                {PIE_DATA.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }}/>
                      <span className="text-xs" style={{ color: 'var(--text-2)' }}>{name}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-1)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System + Recent jobs */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* CPU chart */}
          <div className="panel">
            <div className="panel-header">
              <p className="panel-title">System</p>
              <div className="flex items-center gap-1.5">
                <div className="dot dot-green"/>
                <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Live</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div style={{ height: 112 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cpuHistory} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-3)' }} tickLine={false} width={24}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#38bdf8" fill="url(#gCpu)" strokeWidth={1.5} dot={false}/>
                    <Area type="monotone" dataKey="mem" name="Mem %" stroke="#a78bfa" fill="url(#gMem)" strokeWidth={1.5} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'CPU',    val: sysData?.cpu?.pct    ?? '—', color: '#38bdf8' },
                  { label: 'Memory', val: sysData?.memory?.pct ?? '—', color: '#a78bfa' },
                  { label: 'Disk',   val: sysData?.disk?.pct   ?? '—', color: '#10b981' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</span>
                    <span className="text-xs font-mono font-semibold" style={{ color }}>
                      {typeof val === 'number' ? `${val.toFixed(1)}%` : val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent jobs */}
          <div data-tour="recent-jobs" className="panel lg:col-span-2">
            <div className="panel-header">
              <p className="panel-title">Recent Jobs</p>
              <button onClick={() => setModule('scraper')} className="btn btn-ghost text-xs gap-1">
                View all <ArrowUpRight size={11}/>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Job', 'Engine', 'Status', 'Rows', 'Duration', 'When'].map(h => (
                      <th key={h} className="th text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RECENT_JOBS.map(job => (
                    <tr key={job.id} className="tr cursor-pointer" onClick={() => setModule('scraper')}>
                      <td className="td">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{job.name}</span>
                      </td>
                      <td className="td">
                        <span className="text-xs">{ENGINE_ICON[job.engine]} {job.engine}</span>
                      </td>
                      <td className="td"><StatusBadge status={job.status}/></td>
                      <td className="td font-mono text-xs" style={{ color: 'var(--color-accent-violet)' }}>
                        {job.rows ? job.rows.toLocaleString() : '—'}
                      </td>
                      <td className="td text-xs" style={{ color: 'var(--text-3)' }}>{job.dur}</td>
                      <td className="td text-xs" style={{ color: 'var(--text-3)' }}>{job.ago}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div data-tour="quick-actions" className="panel">
          <div className="panel-header">
            <p className="panel-title">Quick Actions</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'New Scraper Job', icon: Globe,     module: 'scraper'   as const, color: '#38bdf8', bg: 'rgba(56,189,248,.12)'  },
              { label: 'New Pipeline',    icon: GitBranch, module: 'pipelines' as const, color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
              { label: 'Analyse Data',    icon: BarChart3, module: 'analytics' as const, color: '#10b981', bg: 'rgba(16,185,129,.12)'  },
              { label: 'Train Model',     icon: Brain,     module: 'ai'        as const, color: '#fbbf24', bg: 'rgba(251,191,36,.12)'  },
            ].map(({ label, icon: Icon, module, color, bg }) => (
              <button
                key={label}
                onClick={() => setModule(module)}
                className="card p-4 flex items-center gap-3 text-left transition-all"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: bg, color }}>
                  <Icon size={15}/>
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>{label}</span>
                <ArrowUpRight size={12} className="ml-auto" style={{ color: 'var(--text-3)' }}/>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center pb-2">
          <Link to="/about" className="text-xs transition-colors hover:underline"
                style={{ color: 'var(--text-3)' }}>
            DataHarvest v2.0 — View stack info →
          </Link>
        </div>

      </div>
    </div>
  )
}