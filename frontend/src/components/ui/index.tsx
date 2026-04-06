/**
 * DataHarvest — Shared UI Components
 * All CSS classes come from globals.css (Tailwind v4 @layer components)
 */
// src/components/ui/index.tsx
import { type ReactNode, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import {
  Loader2, PackageOpen, CheckCircle2, XCircle,
  Info, AlertTriangle, Copy, Check, Upload,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx('animate-spin', className)} style={{ color: 'var(--brand)' }} />
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export type BV = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'gray'
export function Badge({ children, variant = 'gray', className }: { children: ReactNode; variant?: BV; className?: string }) {
  return <span className={clsx('badge', `badge-${variant}`, className)}>{children}</span>
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; variant: BV; dot?: string }> = {
  completed: { label: 'Completed', variant: 'emerald', dot: 'dot-green'  },
  running:   { label: 'Running',   variant: 'blue',    dot: 'dot-blue'   },
  pending:   { label: 'Pending',   variant: 'amber',   dot: 'dot-amber'  },
  queued:    { label: 'Queued',    variant: 'amber',   dot: 'dot-amber'  },
  failed:    { label: 'Failed',    variant: 'rose',    dot: 'dot-red'    },
  error:     { label: 'Error',     variant: 'rose',    dot: 'dot-red'    },
  paused:    { label: 'Paused',    variant: 'amber',   dot: 'dot-amber'  },
  cancelled: { label: 'Cancelled', variant: 'gray'                       },
  active:    { label: 'Active',    variant: 'emerald', dot: 'dot-green'  },
  draft:     { label: 'Draft',     variant: 'gray'                       },
  idle:      { label: 'Idle',      variant: 'gray',    dot: 'dot-gray'   },
  training:  { label: 'Training',  variant: 'blue',    dot: 'dot-blue'   },
  deployed:  { label: 'Deployed',  variant: 'emerald', dot: 'dot-green'  },
}
export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status?.toLowerCase()] ?? { label: status, variant: 'gray' as BV }
  return (
    <Badge variant={cfg.variant}>
      {cfg.dot && <span className={clsx('dot', cfg.dot)} />}
      {cfg.label}
    </Badge>
  )
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'var(--brand)', animated }: {
  value: number; max?: number; color?: string; animated?: boolean
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--surface-el)' }}>
      <div className={clsx('h-full rounded-full transition-all duration-500', animated && 'animate-pulse')}
           style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('shimmer rounded-md', className)} />
}
export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-1.5 w-full" />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function Empty({ title = 'No data', description, icon, action }: {
  title?: string; description?: string; icon?: ReactNode; action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
           style={{ background: 'var(--surface-el)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
        {icon ?? <PackageOpen size={20} />}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{title}</p>
        {description && <p className="text-xs mt-1 max-w-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, iconColor = 'var(--brand)', delta, positive, onClick }: {
  label: string; value: string | number; sub?: string; icon?: ReactNode;
  iconColor?: string; delta?: string | number; positive?: boolean; onClick?: () => void
}) {
  return (
    <div className={clsx('card p-5 flex flex-col gap-3 transition-colors', onClick && 'cursor-pointer')} onClick={onClick}>
      <div className="flex items-start justify-between">
        <p className="stat-lbl">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: `color-mix(in srgb, ${iconColor} 15%, transparent)`, color: iconColor }}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="stat-val">{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</p>}
      </div>
      {delta !== undefined && (
        <p className="text-xs font-medium" style={{ color: positive ? '#10b981' : '#f43f5e' }}>
          {positive ? '↑' : '↓'} {delta} vs 24h
        </p>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function Panel({ title, subtitle, actions, children, className, noPad }: {
  title?: string; subtitle?: string; actions?: ReactNode;
  children: ReactNode; className?: string; noPad?: boolean
}) {
  return (
    <div className={clsx('panel', className)}>
      {(title || actions) && (
        <div className="panel-header">
          <div>
            {title    && <p className="panel-title">{title}</p>}
            {subtitle && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode; width?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,.55)' }} onClick={onClose} />
      <div className={clsx('relative w-full rounded-2xl shadow-2xl', width)}
           style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                    animation: 'scale-in .2s ease-out' }}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}>
              {title}
            </h2>
            <button onClick={onClose} className="btn btn-ghost p-1.5 text-sm leading-none">✕</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange, className }: {
  tabs: { id: string; label: string; icon?: ReactNode; badge?: string | number }[]
  active: string; onChange: (id: string) => void; className?: string
}) {
  return (
    <div className={clsx('tabs', className)}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} className={clsx('tab flex items-center gap-1.5', active === t.id && 'active')}>
          {t.icon}{t.label}
          {t.badge !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'color-mix(in srgb, var(--brand) 15%, transparent)', color: 'var(--brand)' }}>
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', title, children }: { type?: 'info'|'success'|'warning'|'error'; title?: string; children: ReactNode }) {
  const cfg = {
    info:    { icon: <Info size={13}/>,          cls: 'badge-blue'    },
    success: { icon: <CheckCircle2 size={13}/>,  cls: 'badge-emerald' },
    warning: { icon: <AlertTriangle size={13}/>, cls: 'badge-amber'   },
    error:   { icon: <XCircle size={13}/>,       cls: 'badge-rose'    },
  }[type]
  return (
    <div className={clsx('flex gap-2.5 p-3.5 rounded-xl border text-sm', cfg.cls)}>
      <span className="shrink-0 mt-0.5">{cfg.icon}</span>
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="text-xs opacity-90 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

// ── Copy Button ───────────────────────────────────────────────────────────────
export function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            className={clsx('btn btn-ghost p-1.5 w-7 h-7', className)} title="Copy">
      {copied ? <Check size={11} style={{ color: '#10b981' }}/> : <Copy size={11}/>}
    </button>
  )
}

// ── Code Block ────────────────────────────────────────────────────────────────
export function CodeBlock({ children, language }: { children: string; language?: string }) {
  return (
    <div className="relative group">
      <pre className="code-block">{language && <span className="block text-[10px] uppercase tracking-wider mb-2" style={{ color: '#475569' }}>{language}</span>}<code>{children}</code></pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyBtn text={children} />
      </div>
    </div>
  )
}

// ── Dropzone ──────────────────────────────────────────────────────────────────
export function Dropzone({ onFiles, accept, loading, label = 'Drag & drop or click to upload', sublabel = 'CSV · JSON · XLSX · Parquet' }: {
  onFiles: (files: File[]) => void; accept?: Record<string, string[]>;
  loading?: boolean; label?: string; sublabel?: string
}) {
  const onDrop = useCallback(onFiles, [onFiles])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false,
    accept: accept ?? { 'text/csv': ['.csv'], 'application/json': ['.json'],
      'application/vnd.ms-excel': ['.xlsx', '.xls'], 'application/octet-stream': ['.parquet'] },
  })
  return (
    <div {...getRootProps()} className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
         style={{ borderColor: isDragActive ? 'var(--brand)' : 'var(--border)',
                  background: isDragActive ? 'color-mix(in srgb, var(--brand) 5%, transparent)' : undefined }}>
      <input {...getInputProps()} />
      {loading ? (
        <div className="flex flex-col items-center gap-3"><Spinner size={28}/><p className="text-sm" style={{ color: 'var(--text-3)' }}>Uploading…</p></div>
      ) : (
        <>
          <Upload size={30} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }}/>
          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{isDragActive ? 'Drop it!' : label}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{sublabel}</p>
        </>
      )}
    </div>
  )
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onChange(!checked)}>
      <div className="relative w-9 h-5 rounded-full transition-colors duration-200"
           style={{ background: checked ? 'var(--brand)' : 'var(--border)' }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
             style={{ left: checked ? '18px' : '2px' }}/>
      </div>
      {label && <span className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</span>}
    </label>
  )
}