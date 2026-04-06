import { useEffect, useState } from 'react'

interface Props {
  target: string
}

export function TourSpotlight({ target }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const el = document.querySelector(target)
    if (!el) return

    const update = () => setRect(el.getBoundingClientRect())
    update()

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [target])

  if (!rect) return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(1px)',
    }} />
  )

  const pad = 6

  return (
    <svg
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        pointerEvents: 'none',
        width: '100%', height: '100%',
      }}
    >
      <defs>
        <mask id="spotlight-mask">
          <rect width="100%" height="100%" fill="white"/>
          <rect
            x={rect.left - pad}
            y={rect.top - pad}
            width={rect.width + pad * 2}
            height={rect.height + pad * 2}
            rx="8"
            fill="black"
          />
        </mask>
      </defs>

      {/* Overlay oscuro */}
      <rect
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.65)"
        mask="url(#spotlight-mask)"
      />

      {/* Borde principal */}
      <rect
        x={rect.left - pad}
        y={rect.top - pad}
        width={rect.width + pad * 2}
        height={rect.height + pad * 2}
        rx="8"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2"
        opacity="0.9"
      />

      {/* Pulso exterior */}
      <rect
        x={rect.left - pad - 5}
        y={rect.top - pad - 5}
        width={rect.width + pad * 2 + 10}
        height={rect.height + pad * 2 + 10}
        rx="11"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="1.5"
      >
        <animate attributeName="opacity"      values="0.4;0;0.4"   dur="2s" repeatCount="indefinite"/>
        <animate attributeName="strokeWidth"  values="1.5;3;1.5"   dur="2s" repeatCount="indefinite"/>
      </rect>

      {/* Pulso exterior 2 — más grande y más lento */}
      <rect
        x={rect.left - pad - 10}
        y={rect.top - pad - 10}
        width={rect.width + pad * 2 + 20}
        height={rect.height + pad * 2 + 20}
        rx="14"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="1"
      >
        <animate attributeName="opacity"     values="0.2;0;0.2"   dur="2.5s" repeatCount="indefinite" begin="0.5s"/>
        <animate attributeName="strokeWidth" values="1;2;1"       dur="2.5s" repeatCount="indefinite" begin="0.5s"/>
      </rect>

      {/* Fill sutil dentro del área resaltada */}
      <rect
        x={rect.left - pad}
        y={rect.top - pad}
        width={rect.width + pad * 2}
        height={rect.height + pad * 2}
        rx="8"
        fill="#38bdf8"
        opacity="0.04"
      />
    </svg>
  )
}