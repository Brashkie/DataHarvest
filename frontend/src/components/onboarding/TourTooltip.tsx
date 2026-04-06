import { useEffect, useState, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react'
import type { TourStep } from './types'

interface Props {
  step: TourStep
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}

export function TourTooltip({ step, stepIndex, totalSteps, onNext, onPrev, onSkip }: Props) {
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = document.querySelector(step.target)
    if (!target) return

    // Scroll into view
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const rect = target.getBoundingClientRect()
    const tooltip = tooltipRef.current
    if (!tooltip) return

    const tw = tooltip.offsetWidth  || 280
    const th = tooltip.offsetHeight || 120
    const gap = 12

    let top = 0
    let left = 0

    switch (step.position) {
      case 'right':
        top  = rect.top + rect.height / 2 - th / 2
        left = rect.right + gap
        break
      case 'left':
        top  = rect.top + rect.height / 2 - th / 2
        left = rect.left - tw - gap
        break
      case 'bottom':
        top  = rect.bottom + gap
        left = rect.left + rect.width / 2 - tw / 2
        break
      case 'top':
      default:
        top  = rect.top - th - gap
        left = rect.left + rect.width / 2 - tw / 2
        break
    }

    // Keep within viewport
    top  = Math.max(8, Math.min(top,  window.innerHeight - th - 8))
    left = Math.max(8, Math.min(left, window.innerWidth  - tw - 8))

    setPos({ top, left })
  }, [step])

  const pct = ((stepIndex + 1) / totalSteps) * 100

  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 10001,
        width: 280,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        animation: 'scale-in .2s ease-out',
      }}
    >
      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--surface-el)' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--brand)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
            {step.title}
          </p>
          <button onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, marginLeft: 8, flexShrink: 0 }}>
            <X size={13}/>
          </button>
        </div>

        {/* Content */}
        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>
          {step.content}
        </p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {stepIndex + 1} / {totalSteps}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onSkip}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-3)', padding: '4px 8px', borderRadius: 6 }}
            >
              Omitir
            </button>
            {stepIndex > 0 && (
              <button
                onClick={onPrev}
                className="btn btn-ghost"
                style={{ fontSize: 11, padding: '4px 10px', height: 28, gap: 4 }}
              >
                <ChevronLeft size={12}/> Atrás
              </button>
            )}
            <button
              onClick={onNext}
              style={{
                background: 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                height: 28,
              }}
            >
              {stepIndex === totalSteps - 1 ? '¡Listo!' : 'Siguiente'}
              {stepIndex < totalSteps - 1 && <ChevronRight size={12}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}