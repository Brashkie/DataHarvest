import { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  type Connection, type Edge, type Node,
  Handle, Position, type NodeProps
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  GitBranch, Play, Plus, Pause, CheckCircle2, XCircle,
  Settings2, Trash2, ChevronRight, Zap, Globe, Database,
  Brain, Download, Filter, Layers, RefreshCw, Save, Clock
} from 'lucide-react'
import { clsx } from 'clsx'
import { usePipelines, useCreatePipeline, useRunPipeline } from '../hooks/useApi'
import { StatusBadge, Badge, StatCard, Panel, Empty, Spinner, Modal, Tabs } from '../components/ui'
import toast from 'react-hot-toast'

// ── Node Types ────────────────────────────────────────────────────────────────
const NODE_TYPES_CONFIG = [
  { type: 'scraper',    label: 'Scraper',     icon: Globe,    color: '#0ea5e9', bg: 'bg-blue-500/15',    border: 'border-blue-500/40' },
  { type: 'transform',  label: 'Transform',   icon: Zap,      color: '#8b5cf6', bg: 'bg-violet-500/15',  border: 'border-violet-500/40' },
  { type: 'filter',     label: 'Filter',      icon: Filter,   color: '#f59e0b', bg: 'bg-amber-500/15',   border: 'border-amber-500/40' },
  { type: 'aggregate',  label: 'Aggregate',   icon: Layers,   color: '#10b981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40' },
  { type: 'ai',         label: 'AI / ML',     icon: Brain,    color: '#f43f5e', bg: 'bg-rose-500/15',    border: 'border-rose-500/40' },
  { type: 'export',     label: 'Export',      icon: Download, color: '#06b6d4', bg: 'bg-cyan-500/15',    border: 'border-cyan-500/40' },
  { type: 'database',   label: 'Database',    icon: Database, color: '#6366f1', bg: 'bg-indigo-500/15',  border: 'border-indigo-500/40' },
]

const NODE_COLORS: Record<string, string> = Object.fromEntries(
  NODE_TYPES_CONFIG.map(n => [n.type, n.color])
)

// ── Custom Node Component ─────────────────────────────────────────────────────
function PipelineNode({ data, selected }: NodeProps) {
  const cfg = NODE_TYPES_CONFIG.find(n => n.type === data.nodeType) ?? NODE_TYPES_CONFIG[0]
  const Icon = cfg.icon
  return (
    <div className={clsx(
      'pipeline-node min-w-[160px] rounded-xl transition-all duration-150',
      selected ? 'ring-2 ring-[var(--brand)] ring-offset-1 ring-offset-[var(--bg)]' : '',
      cfg.border
    )}
      style={{ background: 'var(--node-bg)', borderColor: selected ? 'var(--brand)' : undefined }}
    >
      <Handle type="target" position={Position.Left}
        style={{ background: cfg.color, width: 10, height: 10, border: '2px solid var(--node-bg)' }} />

      <div className="flex items-center gap-2.5 p-3">
        <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
          <Icon size={14} style={{ color: cfg.color }} />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{data.label}</p>
          <p className="text-[10px] text-[var(--text-muted)] capitalize">{data.nodeType}</p>
        </div>
        {data.status === 'running' && (
          <div className="status-dot running ml-auto shrink-0" />
        )}
        {data.status === 'completed' && (
          <CheckCircle2 size={12} className="text-emerald-500 ml-auto shrink-0" />
        )}
        {data.status === 'error' && (
          <XCircle size={12} className="text-rose-500 ml-auto shrink-0" />
        )}
      </div>

      {data.config && (
        <div className="px-3 pb-2.5">
          {Object.entries(data.config).slice(0, 2).map(([k, v]) => (
            <div key={k} className="text-[10px] text-[var(--text-muted)] truncate font-mono">
              {k}: <span className="text-[var(--text-secondary)]">{String(v)}</span>
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right}
        style={{ background: cfg.color, width: 10, height: 10, border: '2px solid var(--node-bg)' }} />
    </div>
  )
}

const nodeTypes = { pipelineNode: PipelineNode }

// ── Demo initial nodes ────────────────────────────────────────────────────────
const INIT_NODES: Node[] = [
  { id: '1', type: 'pipelineNode', position: { x: 60, y: 180 },
    data: { label: 'Playwright Scraper', nodeType: 'scraper', config: { url: 'https://target.com', engine: 'playwright' } } },
  { id: '2', type: 'pipelineNode', position: { x: 280, y: 120 },
    data: { label: 'Pandas Clean', nodeType: 'transform', config: { dropna: true, cast: 'auto' } } },
  { id: '3', type: 'pipelineNode', position: { x: 280, y: 260 },
    data: { label: 'Filter Rows', nodeType: 'filter', config: { expression: 'price > 0' } } },
  { id: '4', type: 'pipelineNode', position: { x: 500, y: 180 },
    data: { label: 'ML Predict', nodeType: 'ai', config: { model: 'price_predictor' } } },
  { id: '5', type: 'pipelineNode', position: { x: 720, y: 120 },
    data: { label: 'BigQuery Export', nodeType: 'database', config: { dataset: 'dataharvest_raw' } } },
  { id: '6', type: 'pipelineNode', position: { x: 720, y: 260 },
    data: { label: 'CSV Export', nodeType: 'export', config: { format: 'csv', path: './exports/' } } },
]

const INIT_EDGES: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4', animated: false },
  { id: 'e3-4', source: '3', target: '4', animated: false },
  { id: 'e4-5', source: '4', target: '5', animated: false },
  { id: 'e4-6', source: '4', target: '6', animated: false },
]

// ── Pipeline List Item ────────────────────────────────────────────────────────
function PipelineListItem({ pipeline, isActive, onClick, onRun }: {
  pipeline: any; isActive: boolean; onClick: () => void; onRun: (id: string) => void
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'px-4 py-3 cursor-pointer transition-all border-l-2',
        isActive
          ? 'border-[var(--brand)] bg-[var(--brand)]/8'
          : 'border-transparent hover:bg-[var(--surface-elevated)]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{pipeline.name}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-muted)]">
            <span>{pipeline.run_count ?? 0} runs</span>
            {pipeline.avg_duration_secs && <><span>·</span><span>{pipeline.avg_duration_secs.toFixed(0)}s avg</span></>}
            {pipeline.last_run_at && <><span>·</span><Clock size={9}/><span>recently</span></>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <StatusBadge status={pipeline.status ?? 'draft'} />
          <button
            className="p-1.5 rounded-lg text-[var(--brand)] hover:bg-[var(--brand)]/10 transition-colors"
            onClick={e => { e.stopPropagation(); onRun(pipeline.id) }}
            title="Run pipeline"
          >
            <Play size={11} />
          </button>
        </div>
      </div>
      {pipeline.fail_count > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
          <div className="flex gap-1 flex-1">
            <div className="h-1 rounded-full bg-emerald-500"
              style={{ width: `${(pipeline.success_count / Math.max(pipeline.run_count, 1)) * 100}%`, flex: 1 }} />
            <div className="h-1 rounded-full bg-rose-500"
              style={{ width: `${(pipeline.fail_count / Math.max(pipeline.run_count, 1)) * 100}%` }} />
          </div>
          <span className="text-emerald-500">{pipeline.success_count}✓</span>
          <span className="text-rose-400">{pipeline.fail_count}✗</span>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function PipelinesPage() {
  const [selectedPipeline, setSelectedPipeline] = useState<any>(null)
  const [tab, setTab] = useState<'editor' | 'runs' | 'settings'>('editor')
  const [nodes, setNodes, onNodesChange] = useNodesState(INIT_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState(INIT_EDGES)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  const { data: pipelines, isLoading } = usePipelines()
  const createPipeline = useCreatePipeline()
  const runPipeline = useRunPipeline()

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  const addNode = (nodeType: string) => {
    const cfg = NODE_TYPES_CONFIG.find(n => n.type === nodeType)!
    const id = `node_${Date.now()}`
    setNodes(nds => [...nds, {
      id,
      type: 'pipelineNode',
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 200 },
      data: { label: cfg.label, nodeType, config: {} },
    }])
  }

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Pipeline name required'); return }
    await createPipeline.mutateAsync({
      name: newName,
      definition: { nodes, edges },
    })
    setShowCreate(false)
    setNewName('')
  }

  const handleRun = async (id: string) => {
    await runPipeline.mutateAsync(id)
  }

  const handleSave = () => {
    toast.success('Pipeline saved!')
  }

  const pipelineList = pipelines ?? []
  const totalRuns = pipelineList.reduce((s: number, p: any) => s + (p.run_count ?? 0), 0)
  const active = pipelineList.filter((p: any) => p.status === 'active').length

  return (
    <div className="h-full flex overflow-hidden bg-[var(--bg)]">
      {/* Left Sidebar ── Pipeline List */}
      <div className="w-64 shrink-0 border-r border-[var(--surface-border)] flex flex-col bg-[var(--surface)] overflow-hidden">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-[var(--surface-border)]">
          <div className="text-center p-2 rounded-lg bg-[var(--surface-elevated)]">
            <p className="text-lg font-bold font-display text-[var(--text-primary)]">{pipelineList.length}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Pipelines</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[var(--surface-elevated)]">
            <p className="text-lg font-bold font-display text-[var(--brand)]">{active}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Active</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--surface-border)] shrink-0">
          <span className="text-[12px] font-semibold text-[var(--text-primary)]">All Pipelines</span>
          <button className="btn-primary text-xs py-1 px-2.5" onClick={() => setShowCreate(true)}>
            <Plus size={11} /> New
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !pipelineList.length ? (
            <Empty icon={<GitBranch size={20} />} title="No pipelines"
              description="Build your first data pipeline"
              action={
                <button className="btn-primary text-xs" onClick={() => setShowCreate(true)}>
                  <Plus size={11} /> Create Pipeline
                </button>
              }
            />
          ) : (
            pipelineList.map((p: any) => (
              <PipelineListItem
                key={p.id}
                pipeline={p}
                isActive={selectedPipeline?.id === p.id}
                onClick={() => setSelectedPipeline(p)}
                onRun={handleRun}
              />
            ))
          )}

          {/* Always show demo pipeline */}
          <PipelineListItem
            pipeline={{ id: 'demo', name: 'Scrape → ML → BigQuery', status: 'active', run_count: 38, success_count: 36, fail_count: 2, avg_duration_secs: 45 }}
            isActive={selectedPipeline?.id === 'demo'}
            onClick={() => setSelectedPipeline({ id: 'demo', name: 'Scrape → ML → BigQuery', status: 'active' })}
            onRun={() => toast.success('Pipeline queued!')}
          />
        </div>
      </div>

      {/* Right — Editor / Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--surface-border)] bg-[var(--surface)] shrink-0">
          <div className="flex gap-1">
            {NODE_TYPES_CONFIG.map(cfg => {
              const Icon = cfg.icon
              return (
                <button key={cfg.type}
                  onClick={() => addNode(cfg.type)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all hover:opacity-90 active:scale-95"
                  style={{ background: `${cfg.color}18`, borderColor: `${cfg.color}35`, color: cfg.color }}
                  title={`Add ${cfg.label} node`}
                >
                  <Icon size={11} />
                  {cfg.label}
                </button>
              )
            })}
          </div>

          <div className="flex-1" />

          <Tabs
            tabs={[
              { id: 'editor',   label: 'Visual Editor' },
              { id: 'runs',     label: 'Run History', badge: totalRuns },
              { id: 'settings', label: 'Settings' },
            ]}
            active={tab}
            onChange={t => setTab(t as any)}
          />

          <button className="btn-ghost text-xs py-1.5 gap-1.5" onClick={handleSave}>
            <Save size={12} /> Save
          </button>
          <button className="btn-primary text-xs py-1.5"
            onClick={() => selectedPipeline ? handleRun(selectedPipeline.id) : toast.error('Select a pipeline first')}>
            <Play size={12} /> Run
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {tab === 'editor' && (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
              defaultEdgeOptions={{
                style: { stroke: 'var(--brand)', strokeWidth: 2 },
                animated: false,
              }}
            >
              <Background
                color="var(--chart-grid)"
                gap={24}
                size={1}
              />
              <Controls
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 8,
                }}
              />
              <MiniMap
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                }}
                nodeColor={n => NODE_COLORS[n.data?.nodeType] ?? 'var(--brand)'}
              />
            </ReactFlow>
          )}

          {tab === 'runs' && (
            <div className="overflow-auto h-full p-5">
              <div className="grid grid-cols-3 gap-4 mb-5">
                <StatCard label="Total Runs"   value={totalRuns}                    icon={<RefreshCw size={13}/>} />
                <StatCard label="Success Rate" value="94.7%"                        icon={<CheckCircle2 size={13}/>} iconColor="#10b981" />
                <StatCard label="Avg Duration" value="45s"                          icon={<Clock size={13}/>}       iconColor="#f59e0b" />
              </div>

              <Panel title="Run History">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr>
                      {['Pipeline', 'Started', 'Duration', 'Rows In', 'Rows Out', 'Status'].map(h => (
                        <th key={h} className="data-header text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 8 }, (_, i) => ({
                      pipeline: 'Scrape → ML → BigQuery',
                      started: `${i * 2 + 1}h ago`,
                      duration: `${Math.floor(Math.random() * 90 + 15)}s`,
                      rows_in: Math.floor(Math.random() * 5000 + 500),
                      rows_out: Math.floor(Math.random() * 4000 + 400),
                      status: i === 3 ? 'failed' : 'completed',
                    })).map((run, i) => (
                      <tr key={i} className="hover:bg-[var(--surface-elevated)]">
                        <td className="data-cell font-medium">{run.pipeline}</td>
                        <td className="data-cell text-[var(--text-muted)]">{run.started}</td>
                        <td className="data-cell font-mono">{run.duration}</td>
                        <td className="data-cell font-mono text-[var(--accent-violet)]">{run.rows_in.toLocaleString()}</td>
                        <td className="data-cell font-mono text-[var(--brand)]">{run.rows_out.toLocaleString()}</td>
                        <td className="data-cell"><StatusBadge status={run.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>
          )}

          {tab === 'settings' && (
            <div className="p-5 max-w-lg space-y-4">
              <Panel title="Pipeline Settings">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Pipeline Name</label>
                    <input className="input" defaultValue={selectedPipeline?.name ?? 'My Pipeline'} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Schedule (cron)</label>
                    <input className="input font-mono" placeholder="0 */6 * * *  (every 6 hours)" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Error handling</label>
                    <select className="input">
                      <option>Stop on error</option>
                      <option>Skip failed nodes</option>
                      <option>Retry up to 3 times</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Notifications</label>
                    <input className="input" placeholder="webhook URL or email" />
                  </div>
                  <button className="btn-primary text-xs"><Save size={12}/> Save Settings</button>
                </div>
              </Panel>
            </div>
          )}
        </div>
      </div>

      {/* Create Pipeline Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Pipeline">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Pipeline Name *</label>
            <input className="input" placeholder="E.g. Scrape → Clean → Export"
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Blank',             desc: 'Start from scratch' },
                { label: 'Scrape → Export',   desc: 'Scraper + CSV export' },
                { label: 'ETL + BigQuery',     desc: 'Full cloud pipeline' },
                { label: 'ML Pipeline',        desc: 'Train & predict flow' },
              ].map(t => (
                <button key={t.label} className="p-3 rounded-lg border border-[var(--surface-border)] text-left hover:border-[var(--brand)]/50 transition-all">
                  <p className="text-[12px] font-medium">{t.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--surface-border)]">
            <button className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={createPipeline.isPending}>
              {createPipeline.isPending ? <Spinner size={13}/> : <Plus size={13}/>} Create Pipeline
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}