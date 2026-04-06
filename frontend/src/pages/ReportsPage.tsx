import { useState } from 'react'
import {
  FileText, Download, FilePlus2, Table2,
  FileSpreadsheet, BarChart3, File, Clock
} from 'lucide-react'
import { clsx } from 'clsx'
import { useDatasets, useExport } from '../hooks/useApi'
import { Panel, Empty, StatCard, Spinner } from '../components/ui'
import toast from 'react-hot-toast'

const EXPORT_FORMATS = [
  { id: 'csv',     label: 'CSV',     icon: Table2,         desc: 'Universal, any tool',       color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'xlsx',    label: 'Excel',   icon: FileSpreadsheet, desc: 'Microsoft Excel workbook',  color: 'text-green-500',   bg: 'bg-green-500/10' },
  { id: 'json',    label: 'JSON',    icon: File,            desc: 'Structured array',           color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  { id: 'parquet', label: 'Parquet', icon: BarChart3,       desc: 'Columnar, fast & compact',  color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  { id: 'pdf',     label: 'PDF',     icon: FileText,        desc: 'Styled report with summary', color: 'text-rose-400',    bg: 'bg-rose-500/10' },
]

export function ReportsPage() {
  const [selectedFormat, setSelectedFormat] = useState('csv')
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [filename, setFilename] = useState('dataharvest_export')

  const { data: datasets } = useDatasets()
  const exportData = useExport()

  const handleExport = async () => {
    if (!selectedDataset) { toast.error('Select a dataset first'); return }
    await exportData.mutateAsync({ rows: [], format: selectedFormat, filename })
  }

  return (
    <div className="h-full overflow-auto p-5 space-y-5 bg-[var(--bg)]">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Exports"      value="—" icon={<Download size={14}/>} />
        <StatCard label="Reports Generated"  value="—" icon={<FileText size={14}/>} />
        <StatCard label="Last Export"        value="—" icon={<Clock size={14}/>} />
      </div>

      <Panel title="Export Data" subtitle="Choose a format and dataset to export">
        {/* Format picker */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {EXPORT_FORMATS.map(fmt => {
            const Icon = fmt.icon
            return (
              <button key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={clsx('p-3 rounded-xl border text-center transition-all',
                  selectedFormat === fmt.id
                    ? 'border-[var(--brand)] bg-[var(--brand)]/8 shadow-glow-sm'
                    : 'border-[var(--surface-border)] hover:border-[var(--brand)]/40 hover:bg-[var(--surface-elevated)]'
                )}
              >
                <div className={clsx('mx-auto mb-2 w-8 h-8 rounded-lg flex items-center justify-center', fmt.bg)}>
                  <Icon size={16} className={fmt.color} />
                </div>
                <div className="text-[12px] font-semibold text-[var(--text-primary)]">{fmt.label}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">{fmt.desc}</div>
              </button>
            )
          })}
        </div>

        {/* Dataset picker */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">Select Dataset</label>
          {!datasets?.length ? (
            <p className="text-xs text-[var(--text-muted)]">No datasets available — upload data in the Tables module</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {datasets.map((d: any) => (
                <button key={d.id}
                  onClick={() => setSelectedDataset(d.id)}
                  className={clsx('p-3 rounded-lg border text-left transition-all',
                    selectedDataset === d.id
                      ? 'border-[var(--brand)] bg-[var(--brand)]/8'
                      : 'border-[var(--surface-border)] hover:bg-[var(--surface-elevated)]'
                  )}
                >
                  <p className="text-[12px] font-medium">{d.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{d.row_count?.toLocaleString() ?? '?'} rows · {d.storage_format ?? 'data'}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input className="input max-w-xs font-mono text-sm"
            placeholder="filename (no extension)"
            value={filename} onChange={e => setFilename(e.target.value)} />
          <button className="btn-primary"
            onClick={handleExport}
            disabled={exportData.isPending || !selectedDataset}
          >
            {exportData.isPending
              ? <><Spinner size={13}/> Exporting...</>
              : <><Download size={13}/> Export {selectedFormat.toUpperCase()}</>
            }
          </button>
        </div>
      </Panel>

      <Panel title="Recent Exports">
        <Empty icon={<Download size={20}/>} title="No exports yet"
          description="Export a dataset above to see download history here" />
      </Panel>
    </div>
  )
}