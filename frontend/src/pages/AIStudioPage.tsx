// ── AI Studio Page ────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Brain, Play, TrendingUp, Cpu, Layers, Download, Plus, Zap } from 'lucide-react'
import { clsx } from 'clsx'
import { useModels, useTrainModel, useForecast } from '../hooks/useApi'
import { StatusBadge, Badge, Panel, Empty, Spinner, Modal, Tabs, StatCard } from '../components/ui'
import toast from 'react-hot-toast'

const ALGORITHMS = [
  { id: 'random_forest',  label: 'Random Forest',    icon: '🌲', types: ['classification','regression'] },
  { id: 'gradient_boost', label: 'Gradient Boost',   icon: '⚡', types: ['classification','regression'] },
  { id: 'logistic',       label: 'Logistic Reg.',    icon: '📈', types: ['classification'] },
  { id: 'linear',         label: 'Linear Reg.',      icon: '📉', types: ['regression'] },
  { id: 'xgboost',        label: 'XGBoost',          icon: '🚀', types: ['classification','regression'] },
  { id: 'prophet',        label: 'Prophet',          icon: '🔮', types: ['time_series'] },
]

export function AIStudioPage() {
  const [tab, setTab] = useState('models')
  const [showTrain, setShowTrain] = useState(false)
  const [trainForm, setTrainForm] = useState({
    model_type: 'classification',
    algorithm: 'random_forest',
    target_column: '',
    rows: [] as any[],
  })
  const [pasteData, setPasteData] = useState('')

  const { data: models, isLoading } = useModels()
  const trainModel = useTrainModel()

  const handleParsePaste = () => {
    try {
      const parsed = JSON.parse(pasteData)
      setTrainForm(f => ({ ...f, rows: Array.isArray(parsed) ? parsed : [] }))
      toast.success(`Parsed ${Array.isArray(parsed) ? parsed.length : 0} rows`)
    } catch {
      toast.error('Invalid JSON — paste an array of objects')
    }
  }

  const handleTrain = async () => {
    if (!trainForm.target_column) { toast.error('Target column required'); return }
    if (!trainForm.rows.length) { toast.error('Paste training data first'); return }
    await trainModel.mutateAsync(trainForm)
    setShowTrain(false)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--bg)]">
      <div className="grid grid-cols-4 gap-4 p-5 pb-3 shrink-0">
        <StatCard label="Trained Models" value={models?.length ?? 0}      icon={<Brain size={14}/>} />
        <StatCard label="Deployed"       value={models?.filter((m:any) => m.is_deployed).length ?? 0} icon={<Cpu size={14}/>} iconColor="var(--accent-emerald)" />
        <StatCard label="Predictions"    value="—"                         icon={<Zap size={14}/>}  iconColor="var(--accent-violet)" />
        <StatCard label="Avg Accuracy"   value="87.4%"                     icon={<TrendingUp size={14}/>} iconColor="#f59e0b" />
      </div>

      <div className="flex-1 flex gap-4 px-5 pb-5 overflow-hidden min-h-0">
        {/* Models List */}
        <div className="w-72 shrink-0 panel flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--surface-border)] shrink-0">
            <span className="text-[13px] font-semibold">Models</span>
            <button className="btn-primary text-xs py-1 px-2.5" onClick={() => setShowTrain(true)}>
              <Plus size={11}/> Train
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !models?.length ? (
              <Empty icon={<Brain size={20}/>} title="No models yet"
                description="Train your first ML model"
                action={<button className="btn-primary text-xs" onClick={() => setShowTrain(true)}>Train Model</button>}
              />
            ) : (
              models.map((m: any) => (
                <div key={m.id} className="px-4 py-3 border-b border-[var(--surface-border)] hover:bg-[var(--surface-elevated)] cursor-pointer">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{m.name}</p>
                    {m.is_deployed && <Badge variant="emerald">Live</Badge>}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.algorithm} · {m.model_type}</p>
                  <div className="flex gap-2 mt-1.5 text-[10px]">
                    {Object.entries(m.metrics ?? {}).map(([k, v]: [string, any]) => (
                      <span key={k} className="px-1.5 py-0.5 rounded bg-[var(--brand)]/10 text-[var(--brand)] font-mono">
                        {k}: {typeof v === 'number' ? v.toFixed(3) : v}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right - Forecast / Predict panel */}
        <div className="flex-1 panel overflow-hidden flex flex-col">
          <Tabs
            tabs={[
              { id: 'predict',   label: 'Predict' },
              { id: 'forecast',  label: 'Forecast' },
              { id: 'cluster',   label: 'Cluster' },
              { id: 'patterns',  label: 'Patterns' },
            ]}
            active={tab}
            onChange={setTab}
            className="px-5"
          />
          <div className="flex-1 overflow-auto p-5">
            {tab === 'predict' && (
              <Empty icon={<Brain size={22}/>} title="Prediction Console"
                description="Select a trained model, paste data rows, and run predictions" />
            )}
            {tab === 'forecast' && (
              <div className="space-y-4 max-w-lg">
                <p className="text-sm text-[var(--text-secondary)]">
                  Time-series forecasting using <span className="font-semibold text-[var(--brand)]">Prophet</span>. Paste your date + value data to generate predictions.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Date Column</label>
                    <input className="input" placeholder="date" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Value Column</label>
                    <input className="input" placeholder="value" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Forecast Periods</label>
                  <input type="number" className="input w-32" defaultValue={30} min={1} max={365} />
                </div>
                <button className="btn-primary"><Play size={13}/> Run Forecast</button>
              </div>
            )}
            {tab === 'cluster' && (
              <div className="space-y-4 max-w-lg">
                <p className="text-sm text-[var(--text-secondary)]">
                  K-Means clustering to group your data into segments.
                </p>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Number of Clusters</label>
                  <input type="range" min={2} max={10} defaultValue={3} className="w-full accent-[var(--brand)]" />
                </div>
                <button className="btn-primary"><Play size={13}/> Run Clustering</button>
              </div>
            )}
            {tab === 'patterns' && (
              <Empty icon={<Layers size={22}/>} title="Pattern Detection"
                description="Select a dataset and run automatic pattern, anomaly and trend detection" />
            )}
          </div>
        </div>
      </div>

      {/* Train Model Modal */}
      <Modal open={showTrain} onClose={() => setShowTrain(false)} title="Train New Model" width="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Model Type</label>
              <select className="input" value={trainForm.model_type}
                onChange={e => setTrainForm(f => ({ ...f, model_type: e.target.value }))}>
                <option value="classification">Classification</option>
                <option value="regression">Regression</option>
                <option value="clustering">Clustering</option>
                <option value="time_series">Time Series</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Algorithm</label>
              <select className="input" value={trainForm.algorithm}
                onChange={e => setTrainForm(f => ({ ...f, algorithm: e.target.value }))}>
                {ALGORITHMS.filter(a => a.types.includes(trainForm.model_type)).map(a => (
                  <option key={a.id} value={a.id}>{a.icon} {a.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Target Column *</label>
            <input className="input" placeholder="e.g. price, category, churn"
              value={trainForm.target_column}
              onChange={e => setTrainForm(f => ({ ...f, target_column: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Training Data (JSON array) <span className="text-[10px] font-normal">— paste rows</span>
            </label>
            <textarea className="input font-mono text-xs h-28 resize-none" placeholder='[{"col1": 1, "col2": "a", "target": 0}, ...]'
              value={pasteData} onChange={e => setPasteData(e.target.value)} />
            <button className="btn-ghost text-xs mt-1" onClick={handleParsePaste}>Parse Data</button>
            {trainForm.rows.length > 0 && (
              <p className="text-[11px] text-emerald-500 mt-1">✓ {trainForm.rows.length} rows ready</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--surface-border)]">
            <button className="btn-ghost" onClick={() => setShowTrain(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleTrain} disabled={trainModel.isPending}>
              {trainModel.isPending ? <><Spinner size={13}/> Training...</> : <><Brain size={13}/> Train Model</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}