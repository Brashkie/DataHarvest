import { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Zap, Globe, BarChart3, Database } from 'lucide-react'
import { clsx } from 'clsx'

const STEPS = [
  {
    icon: <Zap size={28} />,
    color: '#38bdf8',
    title: '¡Bienvenido a DataHarvest!',
    desc: 'Tu plataforma profesional para recolectar, analizar y exportar datos de cualquier web.',
    action: 'Empecemos 🚀',
  },
  {
    icon: <Globe size={28} />,
    color: '#a78bfa',
    title: 'Scraper Web',
    desc: 'Pega cualquier URL y DataHarvest extrae los datos automáticamente. Sin código.',
    action: 'Entendido',
  },
  {
    icon: <Database size={28} />,
    color: '#10b981',
    title: 'Tus datos, seguros',
    desc: 'Todo se guarda en Parquet + PostgreSQL. Filtra, ordena y exporta en CSV, Excel o JSON.',
    action: 'Perfecto',
  },
  {
    icon: <BarChart3 size={28} />,
    color: '#fbbf24',
    title: 'Analiza y predice',
    desc: 'Gráficos automáticos, correlaciones y modelos de ML con un clic. Sin configuración.',
    action: '¡Comenzar ahora!',
  },
]

const STORAGE_KEY = 'dh-onboarding-done'

export function Onboarding() {
  const [visible, setVisible]   = useState(false)
  const [step,    setStep]      = useState(0)
  const [leaving, setLeaving]   = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      setTimeout(() => setVisible(true), 800)
    }
  }, [])

  const close = (skip = false) => {
    setLeaving(true)
    setTimeout(() => {
      setVisible(false)
      setLeaving(false)
      if (skip || step === STEPS.length - 1) {
        localStorage.setItem(STORAGE_KEY, 'true')
      }
    }, 300)
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      close()
    }
  }

  const prev = () => {
    if (step > 0) setStep(s => s - 1)
  }

  if (!visible) return null

  const current = STEPS[step]
  const pct = ((step + 1) / STEPS.length) * 100

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100]"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          opacity: leaving ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
        onClick={() => close(true)}
      />

      {/* Card */}
      <div
        className="fixed z-[101]"
        style={{
          top: '50%',
          left: '50%',
          transform: leaving
            ? 'translate(-50%, -48%) scale(0.95)'
            : 'translate(-50%, -50%) scale(1)',
          opacity: leaving ? 0 : 1,
          transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
          width: '100%',
          maxWidth: 440,
          padding: '0 16px',
        }}
      >
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          {/* Progress bar */}
          <div style={{ height: 3, background: 'var(--surface-el)' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: current.color,
              transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Paso {step + 1} de {STEPS.length}
            </span>
            <button
              onClick={() => close(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 6, display: 'flex' }}
            >
              <X size={16}/>
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px 28px 28px', textAlign: 'center' }}>
            {/* Icon */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: `color-mix(in srgb, ${current.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${current.color} 30%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: current.color,
              transition: 'all 0.3s ease',
            }}>
              {current.icon}
            </div>

            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text-1)',
              fontFamily: 'var(--font-display)',
              marginBottom: 10,
              lineHeight: 1.3,
            }}>
              {current.title}
            </h2>

            <p style={{
              fontSize: 14,
              color: 'var(--text-2)',
              lineHeight: 1.6,
              maxWidth: 320,
              margin: '0 auto 28px',
            }}>
              {current.desc}
            </p>

            {/* Dot indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? current.color : 'var(--surface-el)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }} onClick={() => setStep(i)} />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {step > 0 && (
                <button
                  onClick={prev}
                  className="btn btn-ghost"
                  style={{ fontSize: 13, padding: '8px 16px' }}
                >
                  <ArrowLeft size={14}/> Atrás
                </button>
              )}
              <button
                onClick={next}
                style={{
                  background: current.color,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'opacity 0.15s',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {current.action}
                {step < STEPS.length - 1 && <ArrowRight size={14}/>}
              </button>
            </div>

            {/* Skip */}
            {step < STEPS.length - 1 && (
              <button
                onClick={() => close(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12, marginTop: 16, padding: 4 }}
              >
                Saltar tutorial
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Hook para reiniciar el tutorial
export function useResetOnboarding() {
  return () => {
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }
}