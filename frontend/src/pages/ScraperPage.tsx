import { useState } from 'react'
import {
  Globe, Play, Pause, Search, Plus, ChevronRight,
  CheckCircle2, Download, Eye, Layers, Clock, Radio, Trash2,
} from 'lucide-react'
import {
  useScraperJobs,
  useCreateJob,
  useCancelJob,
  useTestUrl,
  useJobResults,
  useJobProgress,
  type ScraperJob,
  type UrlTestResult,
  type JobProgressEvent,
} from '#/hooks/useApi'
import {
  StatusBadge, Badge, ProgressBar, Panel,
  Empty, Spinner, Modal, Tabs, StatCard,
} from '#/components/ui'
import toast from 'react-hot-toast'
import { scraperApi } from '#/lib/api'

const ENGINES = [
  { id: 'auto',         label: 'Auto',         desc: 'Smart selection',      icon: '🤖' },
  { id: 'playwright',   label: 'Playwright',   desc: 'JS / SPA sites',       icon: '🎭' },
  { id: 'selenium',     label: 'Selenium',     desc: 'Complex interactions', icon: '🔧' },
  { id: 'requests',     label: 'Requests',     desc: 'Fast static HTML',     icon: '⚡' },
  { id: 'cloudscraper', label: 'CloudScraper', desc: 'Bypass Cloudflare',    icon: '☁️' },
]

const EXAMPLE_SELECTORS = [
  { label: 'Product names', css: '.product-title, h2.name' },
  { label: 'Prices',        css: '.price, [data-price]'    },
  { label: 'Links',         css: 'a[href]'                 },
  { label: 'Table rows',    css: 'table tr'                },
  { label: 'Article text',  css: 'article p'               },
]

interface JobForm {
  name:           string
  url:            string
  engine:         string
  scroll:         boolean
  screenshot:     boolean
  extract_tables: boolean
  extract_links:  boolean
  stealth:        boolean
  use_tor:        boolean
  wait_ms:        number
  selectors:      Record<string, string>
}

const DEFAULT_FORM: JobForm = {
  name: '', url: '', engine: 'auto',
  scroll: false, screenshot: false,
  extract_tables: true, extract_links: false,
  stealth: false, use_tor: false,
  wait_ms: 0, selectors: {},
}

// ── URL Test Alert ────────────────────────────────────────────────────────────
function UrlTestAlert({ result }: { result: UrlTestResult }) {
  if (!result.reachable) return (
    <div style={{
      marginTop: 12, padding: '12px 16px', borderRadius: 10,
      background: 'color-mix(in srgb,#f43f5e 10%,transparent)',
      border: '1px solid color-mix(in srgb,#f43f5e 25%,transparent)',
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>❌</span>
      <div>
        <p style={{ fontWeight: 700, color: '#fb7185', marginBottom: 3 }}>No se puede acceder a esta URL</p>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
          {result.error ?? 'Error de conexión'} — verifica tu red o activa VPN si es una URL privada.
        </p>
      </div>
    </div>
  )

  if (result.status_code && result.status_code >= 400) return (
    <div style={{
      marginTop: 12, padding: '12px 16px', borderRadius: 10,
      background: 'color-mix(in srgb,#f59e0b 10%,transparent)',
      border: '1px solid color-mix(in srgb,#f59e0b 25%,transparent)',
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
      <div>
        <p style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 3 }}>Error HTTP {result.status_code}</p>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
          {result.status_code === 403 ? 'Acceso denegado — el sitio bloquea scrapers. Prueba CloudScraper o modo Stealth.' :
           result.status_code === 404 ? 'Página no encontrada — verifica que la URL sea correcta.' :
           result.status_code === 429 ? 'Rate limit — demasiadas peticiones. Usa un proxy o espera.' :
           result.status_code >= 500 ? 'Error del servidor — el sitio tiene problemas. Intenta más tarde.' :
           'El sitio respondió con un error inesperado.'}
        </p>
      </div>
    </div>
  )

  if (result.has_cloudflare) return (
    <div style={{
      marginTop: 12, padding: '12px 16px', borderRadius: 10,
      background: 'color-mix(in srgb,#f97316 10%,transparent)',
      border: '1px solid color-mix(in srgb,#f97316 25%,transparent)',
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>☁️</span>
      <div>
        <p style={{ fontWeight: 700, color: '#fb923c', marginBottom: 3 }}>Protección Cloudflare detectada</p>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
          Este sitio usa Cloudflare. Usa el motor <strong style={{ color: '#fb923c' }}>CloudScraper</strong> para evitar el bloqueo.
        </p>
      </div>
    </div>
  )

  if (result.has_javascript) return (
    <div style={{
      marginTop: 12, padding: '12px 16px', borderRadius: 10,
      background: 'color-mix(in srgb,#a78bfa 10%,transparent)',
      border: '1px solid color-mix(in srgb,#a78bfa 25%,transparent)',
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>🎭</span>
      <div>
        <p style={{ fontWeight: 700, color: '#a78bfa', marginBottom: 3 }}>Sitio con JavaScript pesado</p>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
          El contenido se carga dinámicamente. Usa <strong style={{ color: '#a78bfa' }}>Playwright</strong> para renderizar el JS correctamente.
        </p>
      </div>
    </div>
  )

  if (result.response_time_ms > 3000) return (
    <div style={{
      marginTop: 12, padding: '12px 16px', borderRadius: 10,
      background: 'color-mix(in srgb,#fbbf24 10%,transparent)',
      border: '1px solid color-mix(in srgb,#fbbf24 25%,transparent)',
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>🐌</span>
      <div>
        <p style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 3 }}>Sitio lento ({result.response_time_ms}ms)</p>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
          La respuesta tardó más de 3 segundos. Considera aumentar el timeout al crear el job.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{
      marginTop: 12, padding: '12px 16px', borderRadius: 10,
      background: 'color-mix(in srgb,#10b981 10%,transparent)',
      border: '1px solid color-mix(in srgb,#10b981 25%,transparent)',
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>✅</span>
      <div>
        <p style={{ fontWeight: 700, color: '#34d399', marginBottom: 3 }}>URL accesible — listo para scrapejar</p>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
          Respuesta en <strong style={{ color: '#34d399' }}>{result.response_time_ms}ms</strong> · HTTP {result.status_code} · Motor recomendado: <strong style={{ color: '#34d399' }}>⚡ Requests</strong>
        </p>
      </div>
    </div>
  )
}

// ── Results viewer ────────────────────────────────────────────────────────────
function ResultsViewer({ job }: { job: ScraperJob | null }) {
  const [tab,      setTab]      = useState('rows')
  const [progress, setProgress] = useState<Partial<JobProgressEvent>>({})

  useJobProgress(
    job?.status === 'running' ? job.id : null,
    (event) => setProgress(event),
  )

  const { data, isLoading } = useJobResults(job?.id ?? null)

  if (!job) {
    return (
      <Empty
        icon={<Globe size={20} />}
        title="Select a job"
        description="Click any row to view results, logs and config"
      />
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Syne,sans-serif', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.name}
            </h3>
            <a href={job.url} target="_blank" rel="noreferrer"
               style={{ fontSize: 11, color: 'var(--brand)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
              {job.url}
            </a>
          </div>
          <StatusBadge status={job.status} />
        </div>

        {job.status === 'running' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
              <span>{progress.stage ?? 'Processing…'}</span>
              <span>{progress.progress ?? 0}%</span>
            </div>
            <ProgressBar value={progress.progress ?? 0} animated />
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Layers size={11} /> {(job.rows_extracted ?? 0).toLocaleString()} rows
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe size={11} /> {job.pages_scraped ?? 0} pages
          </span>
          {job.duration_secs != null && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {job.duration_secs.toFixed(1)}s
            </span>
          )}
          <span>{ENGINES.find(e => e.id === job.engine)?.icon} {job.engine}</span>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'rows',     label: 'Data',    badge: data?.total_rows },
          { id: 'metadata', label: 'Metadata' },
          { id: 'config',   label: 'Config'   },
        ]}
        active={tab}
        onChange={setTab}
        className="px-5"
      />

      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'rows' && (
          isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160 }}>
              <Spinner />
            </div>
          ) : data?.rows?.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>{data.columns?.map(col => <th key={col} className="th" style={{ textAlign: 'left' }}>{col}</th>)}</tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={i} className="tr">
                      {data.columns?.map(col => (
                        <td key={col} className="td"
                            style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={String(row[col] ?? '')}>
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title={job.status === 'running' ? 'Scraping in progress…' : 'No results yet'}
              description={job.error_message ?? 'Results appear once the job completes'}
            />
          )
        )}

        {tab === 'metadata' && (
          <div style={{ padding: 16 }}>
            {([
              ['Job ID',      job.id],
              ['Engine',      job.engine],
              ['Status',      job.status],
              ['Celery Task', job.celery_task_id ?? '—'],
              ['Started',     job.started_at    ?? '—'],
              ['Completed',   job.completed_at  ?? '—'],
              ['Tags',        job.tags?.join(', ') || '—'],
              ['Error',       job.error_message ?? '—'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ color: 'var(--text-3)' }}>{k}</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-1)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'config' && (
          <pre className="code-block" style={{ margin: 16, overflow: 'auto', fontSize: 11 }}>
            {JSON.stringify(job.config ?? {}, null, 2)}
          </pre>
        )}
      </div>

      {(data?.rows?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}
            onClick={() => {
              const cols = data!.columns
              const csv = [
                cols.join(','),
                ...data!.rows.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')),
              ].join('\n')
              const a = document.createElement('a')
              a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
              a.download = `${job.name.replace(/\s+/g, '_')}.csv`
              a.click()
            }}>
            <Download size={12} /> Export CSV
          </button>
          <button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}
            onClick={() => navigator.clipboard.writeText(JSON.stringify(data!.rows, null, 2)).then(() => toast.success('Copied'))}>
            Copy JSON
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ScraperPage() {
  const [showCreate,  setShowCreate]  = useState(false)
  const [selectedJob, setSelectedJob] = useState<ScraperJob | null>(null)
  const [showDelete,  setShowDelete]  = useState<ScraperJob | null>(null)
  const [deleting,    setDeleting]    = useState(false)
  const [urlTest,     setUrlTest]     = useState<{ url: string; result: UrlTestResult | null }>({ url: '', result: null })
  const [form,        setForm]        = useState<JobForm>(DEFAULT_FORM)
  const [sKey,        setSKey]        = useState('')
  const [sVal,        setSVal]        = useState('')

  const { data: jobsData, isLoading, refetch } = useScraperJobs()
  const createJob = useCreateJob()
  const cancelJob = useCancelJob()
  const testUrl   = useTestUrl()

  const jobs      = (jobsData as any)?.jobs ?? []
  const totalRows = jobs.reduce((s: number, j: ScraperJob) => s + (j.rows_extracted ?? 0), 0)
  const running   = jobs.filter((j: ScraperJob) => j.status === 'running').length
  const completed = jobs.filter((j: ScraperJob) => j.status === 'completed').length

  const handleCreate = async () => {
    if (!form.url || !form.name) { toast.error('Name and URL are required'); return }
    await createJob.mutateAsync(form as unknown as Record<string, unknown>)
    setShowCreate(false)
    setForm(DEFAULT_FORM)
  }

  const handleTest = async () => {
    if (!urlTest.url) return
    try {
      const result = await testUrl.mutateAsync({ url: urlTest.url })
      setUrlTest(prev => ({ ...prev, result }))
    } catch (err: any) {
      setUrlTest(prev => ({
        ...prev,
        result: {
          url: urlTest.url,
          reachable: false,
          status_code: null,
          response_time_ms: 0,
          content_type: '',
          has_javascript: false,
          has_cloudflare: false,
          error: err?.response?.data?.error ?? err?.message ?? 'Cannot reach URL',
        }
      }))
    }
  }

  const handleDelete = async () => {
    if (!showDelete) return
    setDeleting(true)
    try {
      await scraperApi.cancelJob(showDelete.id)
      toast.success(`Job "${showDelete.name}" eliminado`)
      if (selectedJob?.id === showDelete.id) setSelectedJob(null)
      setShowDelete(null)
      refetch()
    } catch (e: any) {
      toast.error(e.message ?? 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const addSelector = () => {
    if (!sKey.trim() || !sVal.trim()) return
    setForm(f => ({ ...f, selectors: { ...f.selectors, [sKey.trim()]: sVal.trim() } }))
    setSKey(''); setSVal('')
  }

  const setField = <K extends keyof JobForm>(key: K, val: JobForm[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, padding: '16px 20px 12px' }}>
        <StatCard label="Total Jobs"     value={jobs.length}                icon={<Globe size={14}/>} />
        <StatCard label="Running"        value={running}                    icon={<Radio size={14}/>}        iconColor="#10b981" />
        <StatCard label="Completed"      value={completed}                  icon={<CheckCircle2 size={14}/>} iconColor="#10b981" />
        <StatCard label="Rows Harvested" value={totalRows.toLocaleString()} icon={<Layers size={14}/>}       iconColor="#8b5cf6" />
      </div>

      {/* URL Tester */}
      <div style={{ padding: '0 20px 12px' }}>
        <Panel title="URL Tester" subtitle="Quick check before creating a job" actions={<Badge variant="emerald">Live</Badge>}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              data-tour="url-input"
              className="input"
              placeholder="https://target-site.com"
              value={urlTest.url}
              onChange={e => setUrlTest({ url: e.target.value, result: null })}
              onKeyDown={e => e.key === 'Enter' && handleTest()}
            />
            <button
              data-tour="test-btn"
              className="btn btn-primary"
              onClick={handleTest}
              disabled={testUrl.isPending || !urlTest.url}
            >
              {testUrl.isPending ? <Spinner size={13}/> : <Search size={14}/>} Test
            </button>
            <button
              data-tour="new-job-btn"
              className="btn btn-secondary"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={14}/> New Job
            </button>
          </div>

          {/* Aviso tipado */}
          {urlTest.result && <UrlTestAlert result={urlTest.result} />}

          {/* Cards de detalle */}
          {urlTest.result?.reachable && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginTop: 12 }}>
              {([
                ['Reachable',   '✅ Yes'],
                ['HTTP',        String(urlTest.result.status_code ?? 'N/A')],
                ['Response',    `${urlTest.result.response_time_ms}ms`],
                ['Cloudflare',  urlTest.result.has_cloudflare ? '⚠️ Yes' : '✅ None'],
                ['JS Heavy',    urlTest.result.has_javascript  ? '⚠️ Yes' : '✅ No'],
                ['Best Engine', urlTest.result.has_cloudflare  ? '☁️ CloudScraper'
                              : urlTest.result.has_javascript  ? '🎭 Playwright'
                              : '⚡ Requests'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ padding: 8, borderRadius: 8, background: 'var(--surface-el)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 2 }}>{k}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-1)' }}>{v}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '0 20px 20px', overflow: 'hidden', minHeight: 0 }}>

        {/* Jobs table */}
        <div
          data-tour="jobs-table"
          className="panel"
          style={{ width: '52%', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div className="panel-header">
            <span className="panel-title">
              Jobs <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)' }}>({jobs.length})</span>
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['All', 'Running', 'Completed', 'Failed'].map(s => (
                <button key={s} className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}><Spinner /></div>
            ) : !jobs.length ? (
              <Empty
                icon={<Globe size={20}/>}
                title="No scraper jobs yet"
                description="Create a job to start extracting data"
                action={
                  <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => setShowCreate(true)}>
                    <Plus size={12}/> Create First Job
                  </button>
                }
              />
            ) : (
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    {['Job / URL', 'Status', 'Rows', 'Duration', ''].map(h => (
                      <th key={h} className="th" style={{ textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job: ScraperJob) => (
                    <tr
                      key={job.id}
                      className="tr"
                      style={{
                        cursor: 'pointer',
                        ...(selectedJob?.id === job.id ? {
                          background: 'color-mix(in srgb, var(--brand) 8%, transparent)',
                          borderLeft: '2px solid var(--brand)',
                        } : {}),
                      }}
                      onClick={() => setSelectedJob(job)}
                    >
                      <td className="td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span>{ENGINES.find(e => e.id === job.engine)?.icon ?? '?'}</span>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{job.name}</p>
                            <p style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{job.url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td"><StatusBadge status={job.status} /></td>
                      <td className="td" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }}>{job.rows_extracted?.toLocaleString() ?? '—'}</td>
                      <td className="td" style={{ fontSize: 12, color: 'var(--text-3)' }}>{job.duration_secs != null ? `${job.duration_secs.toFixed(1)}s` : '—'}</td>
                      <td className="td">
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: 4, width: 24, height: 24 }}
                            onClick={e => { e.stopPropagation(); setSelectedJob(job) }}
                          >
                            <Eye size={11}/>
                          </button>
                          {job.status === 'running' && (
                            <button
                              className="btn btn-ghost"
                              style={{ padding: 4, width: 24, height: 24, color: '#f43f5e' }}
                              onClick={e => { e.stopPropagation(); cancelJob.mutate(job.id) }}
                            >
                              <Pause size={11}/>
                            </button>
                          )}
                          <button
                            className="btn btn-ghost"
                            style={{ padding: 4, width: 24, height: 24, color: '#f43f5e' }}
                            title="Eliminar job"
                            onClick={e => { e.stopPropagation(); setShowDelete(job) }}
                          >
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Results viewer */}
        <div
          data-tour="results-panel"
          className="panel"
          style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          <ResultsViewer job={selectedJob} />
        </div>
      </div>

      {/* Delete Modal */}
      <Modal open={!!showDelete} onClose={() => setShowDelete(null)} title="Eliminar Job" width="max-w-sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
            ¿Eliminar el job <strong style={{ color: 'var(--text-1)' }}>"{showDelete?.name}"</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setShowDelete(null)}>Cancelar</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Spinner size={13}/> : <Trash2 size={13}/>} Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Job Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Scraper Job" width="max-w-2xl">
        <div style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Job Name *</label>
              <input className="input" placeholder="E.g. Product Prices" value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Target URL *</label>
              <input className="input" placeholder="https://..." value={form.url} onChange={e => setField('url', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 8 }}>Engine</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
              {ENGINES.map(eng => (
                <button key={eng.id} onClick={() => setField('engine', eng.id)}
                  style={{
                    padding: 10, borderRadius: 12,
                    border: `1px solid ${form.engine === eng.id ? 'var(--brand)' : 'var(--border)'}`,
                    background: form.engine === eng.id ? 'color-mix(in srgb,var(--brand) 10%,transparent)' : 'transparent',
                    color: form.engine === eng.id ? 'var(--brand)' : 'var(--text-3)',
                    cursor: 'pointer', textAlign: 'center',
                  }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{eng.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{eng.label}</div>
                  <div style={{ fontSize: 9, opacity: .6, marginTop: 2 }}>{eng.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 8 }}>
              CSS Selectors <span style={{ fontWeight: 400, textTransform: 'none', opacity: .6 }}>— optional</span>
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="input" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }} placeholder="field_name" value={sKey} onChange={e => setSKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSelector()} />
              <input className="input" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }} placeholder=".css-selector" value={sVal} onChange={e => setSVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSelector()} />
              <button className="btn btn-secondary" style={{ flexShrink: 0, fontSize: 12 }} onClick={addSelector}>+ Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {EXAMPLE_SELECTORS.map(s => (
                <button key={s.label} className="badge badge-gray" style={{ cursor: 'pointer' }}
                  onClick={() => { setSKey(s.label.toLowerCase().replace(/\s+/g,'_')); setSVal(s.css) }}>
                  {s.label}
                </button>
              ))}
            </div>
            {Object.keys(form.selectors).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(form.selectors).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'var(--surface-el)', border: '1px solid var(--border)', fontSize: 12 }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--brand)', fontWeight: 500 }}>{k}</span>
                    <ChevronRight size={10} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-2)' }}>{v}</span>
                    <button style={{ color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                      onClick={() => { const s={...form.selectors}; delete s[k]; setField('selectors', s) }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {([
              ['scroll',         'Auto-scroll',    '↕️'],
              ['screenshot',     'Screenshot',     '📷'],
              ['extract_tables', 'Extract tables', '📊'],
              ['extract_links',  'Extract links',  '🔗'],
              ['stealth',        'Stealth mode',   '🕵️'],
              ['use_tor',        'Use Tor',        '🧅'],
            ] as [keyof JobForm, string, string][]).map(([key, label, icon]) => (
              <label key={key} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
                border: `1px solid ${(form[key] as boolean) ? 'color-mix(in srgb,var(--brand) 50%,transparent)' : 'var(--border)'}`,
                background: (form[key] as boolean) ? 'color-mix(in srgb,var(--brand) 5%,transparent)' : 'transparent',
                cursor: 'pointer', fontSize: 12,
                color: (form[key] as boolean) ? 'var(--text-1)' : 'var(--text-3)',
              }}>
                <input type="checkbox" checked={form[key] as boolean}
                  onChange={e => setField(key, e.target.checked as JobForm[typeof key])}
                  style={{ accentColor: 'var(--brand)' }} />
                {icon} {label}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={createJob.isPending || !form.name || !form.url}>
              {createJob.isPending ? <><Spinner size={13}/> Creating…</> : <><Play size={13}/> Start Job</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}