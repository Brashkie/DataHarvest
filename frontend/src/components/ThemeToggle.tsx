// src/components/ThemeToggle.tsx
import { useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useStore, applyTheme, type Theme } from '#/stores/appStore'

const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light',  icon: Sun,     label: 'Light'  },
  { value: 'dark',   icon: Moon,    label: 'Dark'   },
  { value: 'system', icon: Monitor, label: 'System' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useStore()

  // Escucha cambios del sistema cuando está en modo system
  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg"
         style={{ background: 'var(--surface-el)', border: '1px solid var(--border)' }}>
      {THEMES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
          style={{
            background: theme === value ? 'var(--surface)' : 'transparent',
            color:      theme === value ? 'var(--brand)'   : 'var(--text-3)',
            boxShadow:  theme === value ? '0 1px 3px rgba(0,0,0,.15)' : 'none',
          }}
        >
          <Icon size={13}/>
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}