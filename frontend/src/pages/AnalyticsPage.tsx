import { useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { useDropzone } from 'react-dropzone'
import {
  BarChart3, Upload, Zap, TrendingUp, AlertTriangle,
  GitMerge, Search, Download, RefreshCw, Filter,
} from 'lucide-react'
import { clsx } from 'clsx'
import { analyticsApi } from '#/lib/api'
import { StatCard, Panel, Tabs, Badge, Empty, Spinner, Modal, Alert } from '#/components/ui'
import toast from 'react-hot-toast'

// ── Demo datasets ─────────────────────────────────────────────────────────────
const DEMO_DATASETS: Record<string, unknown[]> = {
  'E-commerce Sales': Array.from({ length: 60 }, (_, i) => ({
    day:      i + 1,
    revenue:  Math.round(2000 + Math.random() * 8000 + Math.sin(i / 5) * 1000),
    orders:   Math.round(40  + Math.random() * 200),
    aov:      Math.round(40  + Math.random() * 80),
    returns:  Math.round(Math.random() * 20),
    category: ['Electronics', 'Clothing', 'Home', 'Sports'][Math.floor(Math.random() * 4)],
  })),
  'Web Scrape Metrics': Array.from({ length: 48 }, (_, i) => ({
    hour:       i,
    rows:       Math.round(300 + Math.random() * 4000),
    duration_s: Math.round(5   + Math.random() * 120),
    errors:     Math.round(Math.random() * 15),
    pages:      Math.round(1   + Math.random() * 40),
  })),
  'ML Model Stats': Array.from({ length: 30 }, (_, i) => ({
    epoch:     i + 1,
    loss:      parseFloat((2 / (1 + i * 0.1) + Math.random() * 0.1).toFixed(4)),
    val_loss:  parseFloat((2.2 / (1 + i * 0.09) + Math.random() * 0.12).toFixed(4)),
    accuracy:  parseFloat((0.5 + (i * 0.015) + Math.random() * 0.02).toFixed(4)),
  })),
}

const CHART_TYPES = [
  { id: 'area',    label: 'Area'    },
  { id: 'bar',     label: 'Bar'     },
  { id: 'scatter', label: 'Scatter' },
  { id: 'radar',   label: 'Radar'   },
]

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-xl"
         style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--border)' }}>
      <p className="mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} className="font-medium" style={{ color: e.color }}>
          {e.name}: {typeof e.value === 'number' ? e.value.toLocaleString() : e.value}
        </p>
      ))}
    </div>
  )
}

// ── Chart renderer ────────────────────────────────────────────────────────────
function ChartPanel({ data, type, xKey, yKeys }: {
  data: any[]; type: string; xKey: string; yKeys: string[]
}) {
  const COLORS = ['#38bdf8', '#a78bfa', '#10b981', '#fbbf24', '#f43f5e']

  if (!data.length || !yKeys.length) {
    return <Empty title="Select columns" description="Choose X and Y axes above"/>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      {type === 'area' ? (
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            {yKeys.map((k, i) => (
              <linearGradient key={k} id={`ga${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS[i]} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)"/>
          <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false}/>
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} width={42}/>
          <Tooltip content={<ChartTip/>}/>
          {yKeys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} name={k}
              stroke={COLORS[i]} fill={`url(#ga${i})`} strokeWidth={2}/>
          ))}
        </AreaChart>
      ) : type === 'bar' ? (
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)"/>
          <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false}/>
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} width={42}/>
          <Tooltip content={<ChartTip/>}/>
          {yKeys.map((k, i) => (
            <Bar key={k} dataKey={k} name={k} fill={COLORS[i]} radius={[3, 3, 0, 0]}/>
          ))}
        </BarChart>
      ) : type === 'scatter' ? (
        <ScatterChart margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)"/>
          <XAxis dataKey={xKey}    type="number" name={xKey}    tick={{ fontSize: 10, fill: 'var(--text-3)' }}/>
          <YAxis dataKey={yKeys[0]} type="number" name={yKeys[0]} tick={{ fontSize: 10, fill: 'var(--text-3)' }} width={42}/>
          <Tooltip content={<ChartTip/>}/>
          <Scatter data={data} fill="#38bdf8" opacity={0.7} name="Data"/>
        </ScatterChart>
      ) : (
        // Radar - use last 10 rows
        <RadarChart data={data.slice(0, 8)} cx="50%" cy="50%" outerRadius={90}>
          <PolarGrid stroke="var(--chart-grid)"/>
          <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 10, fill: 'var(--text-3)' }}/>
          <Tooltip content={<ChartTip/>}/>
          {yKeys.map((k, i) => (
            <Radar key={k} name={k} dataKey={k} stroke={COLORS[i]}
              fill={COLORS[i]} fillOpacity={0.15}/>
          ))}
        </RadarChart>
      )}
    </ResponsiveContainer>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const [dsName,      setDsName]      = useState('E-commerce Sales')
  const [tab,         setTab]         = useState('charts')
  const [chartType,   setChartType]   = useState('area')
  const [xKey,        setXKey]        = useState('')
  const [yKeys,       setYKeys]       = useState<string[]>([])
  const [profile,     setProfile]     = useState<any>(null)
  const [patterns,    setPatterns]    = useState<any>(null)
  const [profiling,   setProfiling]   = useState(false)
  const [sqlQuery,    setSqlQuery]    = useState('SELECT * FROM data LIMIT 50')
  const [sqlResult,   setSqlResult]   = useState<any>(null)
  const [sqlLoading,  setSqlLoading]  = useState(false)
  const [customData,  setCustomData]  = useState<unknown[] | null>(null)

  const data = (customData ?? DEMO_DATASETS[dsName] ?? []) as any[]
  const cols = data.length ? Object.keys(data[0]) : []
  const numCols = cols.filter(c => typeof data[0][c] === 'number')

  // initialise axis defaults when dataset changes
  const initAxes = (rows: any[]) => {
    if (!rows.length) return
    const c = Object.keys(rows[0])
    const nums = c.filter(k => typeof rows[0][k] === 'number')
    setXKey(c[0] ?? '')
    setYKeys(nums.slice(0, 2))
  }

  const handleDs = (name: string) => {
    setDsName(name)
    setCustomData(null)
    setProfile(null)
    setPatterns(null)
    setSqlResult(null)
    initAxes(DEMO_DATASETS[name] ?? [])
  }

  // upload
  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const text = e.target?.result as string
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text)
          const rows = Array.isArray(parsed) ? parsed : [parsed]
          setCustomData(rows)
          initAxes(rows)
          toast.success(`Loaded ${rows.length} rows`)
        } else {
          // CSV via simple parse
          const lines = text.split('\n').filter(Boolean)
          const headers = lines[0].split(',').map(h => h.trim())
          const rows = lines.slice(1).map(line => {
            const vals = line.split(',')
            return Object.fromEntries(headers.map((h, i) => [h, isNaN(Number(vals[i])) ? vals[i] : Number(vals[i])]))
          })
          setCustomData(rows)
          initAxes(rows)
          toast.success(`Loaded ${rows.length} rows`)
        }
      } catch { toast.error('Failed to parse file') }
    }
    reader.readAsText(file)
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false, accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] }
  })

  // profile
  const handleProfile = async () => {
    if (!data.length) return
    setProfiling(true)
    try {
      const r: any = await analyticsApi.profile({ rows: data.slice(0, 500), fast: false })
      setProfile(r?.data ?? r)
      const pat: any = await analyticsApi.patterns({ rows: data.slice(0, 500) })
      setPatterns(pat?.data ?? pat)
      setTab('profile')
    } catch (e: any) {
      toast.error(e.message ?? 'Profile failed')
    } finally { setProfiling(false) }
  }

  // sql
  const handleSql = async () => {
    if (!data.length) return
    setSqlLoading(true)
    try {
      const r: any = await analyticsApi.sql({ query: sqlQuery, rows: data.slice(0, 2000) })
      setSqlResult(r?.data ?? r)
    } catch (e: any) {
      toast.error(e.message ?? 'Query failed')
    } finally { setSqlLoading(false) }
  }

  const toggleYKey = (k: string) => {
    setYKeys(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k].slice(0, 4))
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 p-4 pb-0 shrink-0">
        <StatCard label="Dataset Rows"   value={data.length.toLocaleString()} icon={<BarChart3 size={13}/>}/>
        <StatCard label="Columns"        value={cols.length}                  icon={<Filter size={13}/>}/>
        <StatCard label="Numeric Cols"   value={numCols.length}               icon={<TrendingUp size={13}/>} iconColor="#10b981"/>
        <StatCard label="Missing Values" value={profile?.missing?.total ?? '—'} icon={<AlertTriangle size={13}/>} iconColor="#f59e0b"/>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0 flex-wrap">
        {/* Dataset selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Object.keys(DEMO_DATASETS).map(name => (
            <button key={name}
              onClick={() => handleDs(name)}
              className={clsx('btn text-xs py-1.5 px-3', dsName === name && !customData ? 'btn-primary' : 'btn-secondary')}
            >{name}</button>
          ))}
          <div {...getRootProps()} className={clsx(
            'btn btn-secondary text-xs py-1.5 px-3 cursor-pointer',
            isDragActive && 'border-[var(--brand)]'
          )}>
            <input {...getInputProps()}/>
            <Upload size={11}/> Upload CSV/JSON
          </div>
        </div>

        <div className="flex-1"/>

        <button className="btn btn-secondary text-xs py-1.5 gap-1.5" onClick={handleProfile} disabled={profiling}>
          {profiling ? <Spinner size={12}/> : <Zap size={12}/>} Auto-Profile
        </button>
        <button className="btn btn-ghost p-2 w-8 h-8"><Download size={13}/></button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'charts',  label: 'Charts'  },
          { id: 'profile', label: 'Profile' },
          { id: 'sql',     label: 'SQL'     },
          { id: 'raw',     label: 'Raw Data', badge: data.length },
        ]}
        active={tab}
        onChange={setTab}
        className="px-4 shrink-0"
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">

        {/* ── Charts tab ── */}
        {tab === 'charts' && (
          <>
            {/* Axis + chart type controls */}
            <div className="panel">
              <div className="panel-header">
                <p className="panel-title">Chart Builder</p>
                <div className="flex gap-1">
                  {CHART_TYPES.map(ct => (
                    <button key={ct.id}
                      onClick={() => setChartType(ct.id)}
                      className={clsx('btn text-xs py-1 px-2.5', chartType === ct.id ? 'btn-primary' : 'btn-ghost')}>
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="flex gap-4 flex-wrap mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>X Axis</label>
                    <select className="input w-40 text-xs" value={xKey} onChange={e => setXKey(e.target.value)}>
                      {cols.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Y Axis (max 4)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {numCols.map(c => (
                        <button key={c}
                          onClick={() => toggleYKey(c)}
                          className={clsx('badge cursor-pointer transition-all', yKeys.includes(c) ? 'badge-blue' : 'badge-gray')}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <ChartPanel data={data.slice(0, 60)} type={chartType} xKey={xKey} yKeys={yKeys}/>
              </div>
            </div>

            {/* Auto mini-charts for numeric cols */}
            {numCols.length > 0 && (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {numCols.slice(0, 6).map(col => (
                  <div key={col} className="panel">
                    <div className="panel-header">
                      <p className="panel-title text-xs">{col}</p>
                      <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>distribution</span>
                    </div>
                    <div className="px-3 pb-3 h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.slice(0, 40)} margin={{ top: 4, right: 2, left: -30, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`gm${col}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <YAxis tick={{ fontSize: 9, fill: 'var(--text-3)' }} tickLine={false} width={28}/>
                          <Tooltip content={<ChartTip/>}/>
                          <Area type="monotone" dataKey={col} stroke="#38bdf8" fill={`url(#gm${col})`} strokeWidth={1.5} dot={false}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="px-3 pb-3 grid grid-cols-3 gap-1 text-[10px]">
                      {[
                        { l: 'min', v: Math.min(...data.map((r: any) => +r[col]).filter(n => !isNaN(n))).toFixed(1) },
                        { l: 'avg', v: (data.reduce((s, r: any) => s + (+r[col] || 0), 0) / data.length).toFixed(1) },
                        { l: 'max', v: Math.max(...data.map((r: any) => +r[col]).filter(n => !isNaN(n))).toFixed(1) },
                      ].map(({ l, v }) => (
                        <div key={l} className="text-center p-1.5 rounded" style={{ background: 'var(--surface-el)' }}>
                          <p style={{ color: 'var(--text-3)' }}>{l}</p>
                          <p className="font-mono font-semibold" style={{ color: 'var(--text-1)' }}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          !profile ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Zap size={36} style={{ color: 'var(--text-3)' }}/>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                Run Auto-Profile to get EDA statistics, quality report and pattern detection
              </p>
              <button className="btn btn-primary" onClick={handleProfile} disabled={profiling}>
                {profiling ? <><Spinner size={13}/> Profiling...</> : <><Zap size={13}/> Run Profile</>}
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-[fade-in_.3s_ease-in-out]">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-3">
                <StatCard label="Rows"    value={profile.shape?.rows?.toLocaleString() ?? '—'}   icon={<BarChart3 size={13}/>}/>
                <StatCard label="Columns" value={profile.shape?.columns ?? '—'}                  icon={<Filter size={13}/>}/>
                <StatCard label="Memory"  value={`${profile.memory_mb ?? '—'} MB`}               icon={<Zap size={13}/>}/>
                <StatCard label="Missing" value={profile.missing?.total ?? 0}                    icon={<AlertTriangle size={13}/>} iconColor="#f59e0b"/>
              </div>

              {/* Column stats */}
              <Panel title="Column Statistics">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        {['Column', 'Type', 'Count', 'Missing', 'Unique', 'Min', 'Max', 'Mean'].map(h => (
                          <th key={h} className="th text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(profile.columns ?? {}).map(([col, info]: [string, any]) => (
                        <tr key={col} className="tr">
                          <td className="td font-mono font-medium" style={{ color: 'var(--text-1)' }}>{col}</td>
                          <td className="td"><Badge variant="blue">{info.dtype?.replace('64','')}</Badge></td>
                          <td className="td">{info.count}</td>
                          <td className="td" style={{ color: info.missing > 0 ? '#f59e0b' : 'var(--text-3)' }}>
                            {info.missing ?? 0}
                          </td>
                          <td className="td">{info.unique}</td>
                          <td className="td font-mono" style={{ color: '#a78bfa' }}>{info.min?.toFixed?.(2) ?? '—'}</td>
                          <td className="td font-mono" style={{ color: '#a78bfa' }}>{info.max?.toFixed?.(2) ?? '—'}</td>
                          <td className="td font-mono">{info.mean?.toFixed?.(2) ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              {/* Patterns */}
              {patterns && Object.entries(patterns.patterns ?? {}).some(([, v]: any) => v.length > 0) && (
                <Panel title="Detected Patterns">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {Object.entries(patterns.patterns ?? {}).map(([type, cols]: [string, any]) =>
                      cols.length > 0 ? (
                        <div key={type} className="p-3 rounded-lg" style={{ background: 'var(--surface-el)', border: '1px solid var(--border)' }}>
                          <p className="text-[10px] uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>
                            {type.replace(/_/g, ' ')}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {cols.map((c: string) => <Badge key={c} variant="blue">{c}</Badge>)}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </Panel>
              )}
            </div>
          )
        )}

        {/* ── SQL tab ── */}
        {tab === 'sql' && (
          <div className="space-y-4">
            <Panel title="DuckDB SQL" subtitle="Query runs in-memory on the current dataset">
              <div className="space-y-3">
                <textarea
                  className="input font-mono text-xs h-28 resize-none"
                  value={sqlQuery}
                  onChange={e => setSqlQuery(e.target.value)}
                  spellCheck={false}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <button className="btn btn-primary text-xs" onClick={handleSql} disabled={sqlLoading}>
                    {sqlLoading ? <Spinner size={12}/> : null} Run Query
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      `SELECT * FROM data LIMIT 20`,
                      `SELECT COUNT(*) as total FROM data`,
                      numCols[0] ? `SELECT AVG(${numCols[0]}) as avg_val FROM data` : null,
                    ].filter(Boolean).map((q, i) => (
                      <button key={i} className="badge badge-gray cursor-pointer hover:opacity-75 text-[10px]"
                        onClick={() => setSqlQuery(q!)}>{q!.slice(0, 32)}…</button>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            {sqlResult && (
              <Panel title={`Results — ${sqlResult.total_rows?.toLocaleString() ?? '?'} rows`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>{sqlResult.columns?.map((c: string) => <th key={c} className="th text-left">{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {sqlResult.rows?.slice(0, 100).map((row: any, i: number) => (
                        <tr key={i} className="tr">
                          {sqlResult.columns?.map((c: string) => (
                            <td key={c} className="td max-w-[180px] truncate">{String(row[c] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* ── Raw data tab ── */}
        {tab === 'raw' && (
          <Panel title="Raw Data" subtitle={`First 200 of ${data.length} rows`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="th text-center w-10">#</th>
                    {cols.map(c => <th key={c} className="th text-left">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 200).map((row: any, i: number) => (
                    <tr key={i} className="tr">
                      <td className="td text-center" style={{ color: 'var(--text-3)' }}>{i + 1}</td>
                      {cols.map(c => (
                        <td key={c} className="td max-w-[160px] truncate"
                            style={{ color: typeof row[c] === 'number' ? '#a78bfa' : 'var(--text-2)' }}>
                          {String(row[c] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

      </div>
    </div>
  )
}