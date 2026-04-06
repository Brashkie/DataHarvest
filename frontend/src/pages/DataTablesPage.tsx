import { useState, useCallback, useRef } from 'react'
import {
  Table2, Upload, Download, Filter, Plus, Search, Zap,
  RefreshCw, Database, Eye, Trash2, ChevronDown,
  Wand2, BarChart3, Code2
} from 'lucide-react'
import { clsx } from 'clsx'
import { useDropzone } from 'react-dropzone'
import { useDatasets, useDataset, useUploadDataset } from '../hooks/useApi'
import { tablesApi, analyticsApi } from '../lib/api'
import { StatusBadge, Badge, Panel, Empty, Spinner, Modal, Tabs, StatCard } from '../components/ui'
import toast from 'react-hot-toast'

// ── Format helpers ────────────────────────────────────────────────────────────
const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1048576).toFixed(1)} MB`
}

const TYPE_COLORS: Record<string, string> = {
  integer: 'badge-blue',
  float:   'badge-violet',
  text:    'badge-default',
  boolean: 'badge-amber',
  datetime:'badge-emerald',
}

// ── Data Table (virtualized manual impl) ─────────────────────────────────────
function DataGrid({ columns, rows, dtypes }: { columns: string[]; rows: any[]; dtypes: Record<string,string> }) {
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setPage(0)
  }

  const filtered = filter
    ? rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(filter.toLowerCase())))
    : rows

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol]
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
    : filtered

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--surface-border)] shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"/>
          <input className="input pl-7 h-7 text-xs" placeholder="Filter rows..."
            value={filter} onChange={e => { setFilter(e.target.value); setPage(0) }}/>
        </div>
        <span className="text-[11px] text-[var(--text-muted)] ml-auto">
          {sorted.length.toLocaleString()} / {rows.length.toLocaleString()} rows
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">
          {columns.length} cols
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[12px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="data-header w-10 text-center">#</th>
              {columns.map(col => (
                <th key={col} className="data-header whitespace-nowrap cursor-pointer select-none hover:bg-[var(--brand)]/5 transition-colors"
                  onClick={() => handleSort(col)}>
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    <span className={clsx('text-[9px] px-1 py-0.5 rounded font-mono',
                      'bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-muted)]')}>
                      {dtypes[col] ?? 'text'}
                    </span>
                    {sortCol === col && (
                      <span className="text-[var(--brand)]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} className="hover:bg-[var(--surface-elevated)] group">
                <td className="data-cell text-center text-[var(--text-muted)] w-10">
                  {page * PAGE_SIZE + i + 1}
                </td>
                {columns.map(col => {
                  const val = row[col]
                  const dtype = dtypes[col] ?? 'text'
                  return (
                    <td key={col} className="data-cell max-w-[200px]">
                      <span className={clsx('block truncate',
                        dtype === 'integer' || dtype === 'float' ? 'font-mono text-right text-[var(--accent-violet)]' :
                        val === null || val === '' ? 'text-[var(--text-muted)] italic' : ''
                      )} title={String(val ?? '')}>
                        {val === null || val === undefined ? 'null' : String(val)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--surface-border)] shrink-0">
          <button className="btn-ghost text-xs py-1" disabled={page === 0} onClick={() => setPage(0)}>«</button>
          <button className="btn-ghost text-xs py-1" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
          <span className="text-[11px] text-[var(--text-muted)]">
            Page {page + 1} / {totalPages} · {sorted.length.toLocaleString()} rows
          </span>
          <button className="btn-ghost text-xs py-1" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next ›</button>
          <button className="btn-ghost text-xs py-1" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
        </div>
      )}
    </div>
  )
}

// ── Upload Dropzone ───────────────────────────────────────────────────────────
function UploadZone({ onSuccess }: { onSuccess: (ds: any) => void }) {
  const upload = useUploadDataset()
  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return
    const r = await upload.mutateAsync(files[0])
    onSuccess(r as any)
    //if (r.data) onSuccess(r.data)
  }, [upload, onSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false,
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'],
              'application/vnd.ms-excel': ['.xlsx', '.xls'],
              'application/octet-stream': ['.parquet'] }
  })

  return (
    <div {...getRootProps()} className={clsx(
      'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
      isDragActive
        ? 'border-[var(--brand)] bg-[var(--brand)]/5'
        : 'border-[var(--surface-border)] hover:border-[var(--brand)]/50 hover:bg-[var(--surface-elevated)]'
    )}>
      <input {...getInputProps()} />
      {upload.isPending ? (
        <div className="flex flex-col items-center gap-3">
          <Spinner size={28}/>
          <p className="text-sm text-[var(--text-muted)]">Uploading & parsing...</p>
        </div>
      ) : (
        <>
          <Upload size={32} className="mx-auto mb-3 text-[var(--text-muted)]"/>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
            {isDragActive ? 'Drop to upload' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-[var(--text-muted)]">CSV · JSON · XLSX · Parquet · up to 500 MB</p>
        </>
      )}
    </div>
  )
}

export function DataTablesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState('data')
  const [showUpload, setShowUpload] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM data LIMIT 100')
  const [sqlResult, setSqlResult] = useState<any>(null)
  const [sqlLoading, setSqlLoading] = useState(false)

  const { data: datasets, isLoading: loadingDatasets } = useDatasets()
  const { data: dsData, isLoading: loadingDs } = useDataset(selectedId)

  const ds = dsData

  const handleProfile = async () => {
    if (!ds?.rows) return
    setProfileLoading(true)
    try {
      const r = await analyticsApi.profile({ rows: ds.rows, fast: false })
      setProfileData(r)
      setTab('profile')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSql = async () => {
    if (!ds?.rows) return
    setSqlLoading(true)
    try {
      const r = await analyticsApi.sql({ query: sqlQuery, rows: ds.rows })
      setSqlResult(r)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSqlLoading(false)
    }
  }

  const exportCsv = () => {
    if (!ds?.rows) return
    const csv = [ds.columns.join(','),
      ...ds.rows.map((r: any) => ds.columns.map((c: string) => `"${String(r[c]??'').replace(/"/g,'""')}"`).join(','))
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }))
    a.download = `dataset.csv`; a.click()
  }

  return (
    <div className="h-full flex overflow-hidden bg-[var(--bg)]">
      {/* Sidebar — Dataset List */}
      <div className="w-64 shrink-0 border-r border-[var(--surface-border)] flex flex-col bg-[var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--surface-border)] shrink-0">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">Datasets</span>
          <button className="btn-primary text-xs py-1 px-2.5" onClick={() => setShowUpload(true)}>
            <Plus size={11}/> Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {loadingDatasets ? (
            <div className="flex justify-center py-8"><Spinner/></div>
          ) : !datasets?.length ? (
            <div className="p-4 text-center">
              <Database size={24} className="mx-auto mb-2 text-[var(--text-muted)]"/>
              <p className="text-xs text-[var(--text-muted)]">No datasets yet</p>
              <button className="btn-primary text-xs mt-2" onClick={() => setShowUpload(true)}>Upload</button>
            </div>
          ) : (
            datasets.map((d: any) => (
              <button key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={clsx('w-full text-left px-4 py-3 transition-all border-l-2',
                  selectedId === d.id
                    ? 'border-[var(--brand)] bg-[var(--brand)]/8'
                    : 'border-transparent hover:bg-[var(--surface-elevated)]'
                )}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <p className="text-[12px] font-medium text-[var(--text-primary)] truncate leading-tight">{d.name}</p>
                  <Badge variant={d.source_type === 'scraper' ? 'violet' : d.source_type === 'upload' ? 'blue' : 'gray'}>
                    {d.source_type ?? 'data'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-muted)]">
                  <span>{d.row_count?.toLocaleString() ?? '?'} rows</span>
                  <span>·</span>
                  <span>{d.column_count ?? '?'} cols</span>
                  {d.size_bytes && <><span>·</span><span>{fmtBytes(d.size_bytes)}</span></>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <Empty icon={<Table2 size={24}/>} title="Select a dataset"
              description="Choose a dataset from the left panel, or upload a new file"
              action={<button className="btn-primary text-xs" onClick={() => setShowUpload(true)}><Upload size={12}/> Upload Dataset</button>}
            />
          </div>
        ) : loadingDs ? (
          <div className="flex-1 flex items-center justify-center"><Spinner size={24}/></div>
        ) : ds ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--surface-border)] bg-[var(--surface)] shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-[14px] font-semibold truncate">Dataset</h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {ds.total_rows?.toLocaleString()} rows · {ds.columns?.length} columns · {ds.storage_format ?? 'parquet'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="btn-ghost text-xs py-1.5" onClick={handleProfile} disabled={profileLoading}>
                  {profileLoading ? <Spinner size={12}/> : <Zap size={12}/>} Profile
                </button>
                <button className="btn-ghost text-xs py-1.5" onClick={exportCsv}>
                  <Download size={12}/> CSV
                </button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              tabs={[
                { id: 'data',    label: 'Data',    badge: ds.total_rows },
                { id: 'schema',  label: 'Schema',  badge: ds.columns?.length },
                { id: 'profile', label: 'Profile' },
                { id: 'sql',     label: 'SQL Query' },
              ]}
              active={tab}
              onChange={setTab}
              className="px-5 bg-[var(--surface)] border-b border-[var(--surface-border)]"
            />

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {tab === 'data' && (
                <DataGrid columns={ds.columns ?? []} rows={ds.rows ?? []} dtypes={ds.dtypes ?? {}} />
              )}

              {tab === 'schema' && (
                <div className="overflow-auto h-full p-5">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr>
                        {['Column', 'Type', 'Non-Null', 'Unique', 'Sample'].map(h => (
                          <th key={h} className="data-header text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(ds.columns ?? []).map((col: string) => {
                        const dtype = ds.dtypes?.[col] ?? 'text'
                        const sample = ds.rows?.[0]?.[col]
                        return (
                          <tr key={col} className="hover:bg-[var(--surface-elevated)]">
                            <td className="data-cell font-mono font-medium text-[var(--text-primary)]">{col}</td>
                            <td className="data-cell">
                              <span className={clsx('badge', TYPE_COLORS[dtype] ?? 'badge-default')}>{dtype}</span>
                            </td>
                            <td className="data-cell text-[var(--text-muted)]">—</td>
                            <td className="data-cell text-[var(--text-muted)]">—</td>
                            <td className="data-cell font-mono text-[var(--text-muted)] truncate max-w-[150px]">
                              {sample !== undefined ? String(sample) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'profile' && (
                <div className="overflow-auto h-full p-5">
                  {!profileData ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <Zap size={36} className="text-[var(--text-muted)]"/>
                      <p className="text-sm text-[var(--text-secondary)]">Run profile analysis to see column stats, patterns and quality report</p>
                      <button className="btn-primary" onClick={handleProfile} disabled={profileLoading}>
                        {profileLoading ? <Spinner size={14}/> : <Zap size={14}/>}
                        Run Auto-Profile
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5 animate-fade-in">
                      {/* Summary */}
                      <div className="grid grid-cols-4 gap-3">
                        <StatCard label="Rows"        value={profileData.shape?.rows?.toLocaleString() ?? '—'} icon={<Table2 size={13}/>}/>
                        <StatCard label="Columns"     value={profileData.shape?.columns ?? '—'} icon={<Database size={13}/>}/>
                        <StatCard label="Memory"      value={`${profileData.memory_mb ?? '—'} MB`} icon={<Zap size={13}/>}/>
                        <StatCard label="Missing"     value={`${profileData.missing?.total ?? 0}`} icon={<Filter size={13}/>}/>
                      </div>

                      {/* Per-column stats */}
                      <Panel title="Column Statistics">
                        <div className="overflow-x-auto">
                          <table className="w-full text-[12px]">
                            <thead>
                              <tr>
                                {['Column','Type','Count','Missing %','Unique','Min','Max','Mean'].map(h => (
                                  <th key={h} className="data-header text-left">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(profileData.columns ?? {}).map(([col, info]: [string, any]) => (
                                <tr key={col} className="hover:bg-[var(--surface-elevated)]">
                                  <td className="data-cell font-mono font-medium">{col}</td>
                                  <td className="data-cell"><span className="badge badge-blue">{info.dtype}</span></td>
                                  <td className="data-cell">{info.count}</td>
                                  <td className="data-cell text-[var(--text-muted)]">{info.missing ? `${((info.missing/profileData.shape.rows)*100).toFixed(1)}%` : '0%'}</td>
                                  <td className="data-cell">{info.unique}</td>
                                  <td className="data-cell font-mono text-[var(--accent-violet)]">{info.min ?? '—'}</td>
                                  <td className="data-cell font-mono text-[var(--accent-violet)]">{info.max ?? '—'}</td>
                                  <td className="data-cell font-mono">{info.mean?.toFixed(2) ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Panel>

                      {/* Patterns */}
                      {profileData.patterns && (
                        <Panel title="Detected Patterns">
                          <div className="grid grid-cols-3 gap-3 text-[12px]">
                            {Object.entries(profileData.patterns).map(([type, cols]: [string, any]) => cols.length > 0 && (
                              <div key={type} className="p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)]">
                                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-2">
                                  {type.replace(/_/g,' ')}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {cols.map((c: string) => <Badge key={c} variant="blue">{c}</Badge>)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Panel>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === 'sql' && (
                <div className="h-full flex flex-col p-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--text-muted)]">
                      DuckDB SQL — query runs in-memory on your data
                    </label>
                    <div className="relative">
                      <textarea
                        className="input font-mono text-xs h-28 resize-none"
                        value={sqlQuery}
                        onChange={e => setSqlQuery(e.target.value)}
                        spellCheck={false}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary text-xs" onClick={handleSql} disabled={sqlLoading}>
                        {sqlLoading ? <Spinner size={12}/> : <Code2 size={12}/>} Run Query
                      </button>
                      <div className="flex flex-wrap gap-1.5">
                        {['SELECT * FROM data LIMIT 50',
                          'SELECT COUNT(*) FROM data',
                          'SELECT * FROM data WHERE ... LIMIT 100',
                        ].map(q => (
                          <button key={q} className="badge badge-blue cursor-pointer text-[10px] hover:opacity-75"
                            onClick={() => setSqlQuery(q)}>{q.slice(0, 30)}...</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {sqlResult && (
                    <div className="flex-1 overflow-auto panel">
                      <div className="px-4 py-2 border-b border-[var(--surface-border)] text-[11px] text-[var(--text-muted)]">
                        {sqlResult.total_rows?.toLocaleString()} rows returned
                      </div>
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr>
                            {sqlResult.columns?.map((c: string) => (
                              <th key={c} className="data-header text-left">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlResult.rows?.slice(0, 200).map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-[var(--surface-elevated)]">
                              {sqlResult.columns?.map((c: string) => (
                                <td key={c} className="data-cell max-w-[200px] truncate">{String(row[c] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Dataset" width="max-w-lg">
        <UploadZone onSuccess={(ds) => {
          toast.success(`Uploaded: ${ds.rows} rows × ${ds.columns?.length} cols`)
          setShowUpload(false)
        }} />
        <p className="text-xs text-[var(--text-muted)] mt-3 text-center">
          Supported: CSV · JSON · XLSX · XLS · Parquet · up to 500 MB
        </p>
      </Modal>
    </div>
  )
}