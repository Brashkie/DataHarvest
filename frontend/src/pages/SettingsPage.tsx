import { useState } from 'react'
import { Moon, Sun, Zap, Key, Save } from 'lucide-react'
import { useStore } from '#/stores/appStore'      // ✅ correct: useStore not useAppStore
import { Panel, Spinner } from '#/components/ui'
import { healthApi } from '#/lib/api'
import toast from 'react-hot-toast'
import { useResetOnboarding } from '#/components/Onboarding'
import { useResetTours } from '#/components/onboarding/TourManager'

export function SettingsPage() {
  const { theme, toggleTheme, backendUrl, setBackendUrl, apiConnected } = useStore()
  const [url,        setUrl]        = useState(backendUrl)
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await healthApi.check()
      setTestResult('✅ Connected successfully')
    } catch {
      setTestResult('❌ Failed — check URL and that the backend is running')
    } finally {
      setTesting(false)
    }
  }
  const resetOnboarding = useResetOnboarding()
  const resetTours = useResetTours()

  return (
    <div className="h-full overflow-auto p-5 bg-[var(--bg)]" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="space-y-5">

        {/* Appearance */}
        <Panel title="Appearance">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>Theme</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                Switch between dark and light interface
              </p>
            </div>
            <button className="btn btn-secondary" style={{ gap: 8 }} onClick={toggleTheme}>
              {theme === 'dark'
                ? <><Sun  size={14} /> Light Mode</>
                : <><Moon size={14} /> Dark Mode</>
              }
            </button>
          </div>
        </Panel>

        {/* Backend Connection */}
        <Panel title="Backend Connection">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={apiConnected ? 'dot dot-green' : 'dot dot-red'} />
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {apiConnected ? 'Connected to Flask API' : 'Backend offline'}
              </span>
            </div>

            {/* URL input */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>
                Backend URL
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="http://localhost:5000"
                />
                <button
                  className="btn btn-secondary"
                  style={{ flexShrink: 0 }}
                  onClick={() => { setBackendUrl(url); toast.success('URL saved') }}
                >
                  <Save size={13} /> Save
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ flexShrink: 0 }}
                  onClick={handleTest}
                  disabled={testing}
                >
                  {testing ? <Spinner size={13} /> : <Zap size={13} />} Test
                </button>
              </div>
              {testResult && (
                <p style={{ fontSize: 12, marginTop: 8, color: 'var(--text-2)' }}>{testResult}</p>
              )}
            </div>

            {/* Endpoint reference */}
            <div className="code-block" style={{ fontSize: 11 }}>
              {[
                ['API:    ', `${url}/api/v1/`],
                ['Docs:   ', `${url}/api/docs/`],
                ['Flower: ', 'http://localhost:5555'],
                ['MLflow: ', 'http://localhost:5001'],
              ].map(([label, val]) => (
                <div key={label} style={{ lineHeight: 1.8 }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <span>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Scraping defaults */}
        <Panel title="Scraping Defaults">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {([
              { label: 'Default Engine', type: 'select', options: ['auto', 'playwright', 'requests', 'selenium', 'cloudscraper'] },
              { label: 'Request Timeout (s)', type: 'number', def: '30' },
              { label: 'Max Concurrent Scrapers', type: 'number', def: '10' },
              { label: 'Retry Attempts', type: 'number', def: '3' },
            ] as const).map(opt => (
              <div key={opt.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <label style={{ fontSize: 13, color: 'var(--text-2)', flexShrink: 0 }}>{opt.label}</label>
                {opt.type === 'select' ? (
                  <select className="input" style={{ width: 160, fontSize: 12 }}>
                    {opt.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="number" className="input" style={{ width: 80, fontSize: 12, textAlign: 'right', fontFamily: 'JetBrains Mono,monospace' }} defaultValue={opt.def} />
                )}
              </div>
            ))}
          </div>
        </Panel>

        {/* API Keys */}
        <Panel title="API Keys & Credentials">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'OpenAI API Key',    placeholder: 'sk-...' },
              { label: 'HuggingFace Token', placeholder: 'hf_...' },
              { label: 'GCP Project ID',    placeholder: 'my-project-id' },
              { label: 'AWS Access Key',    placeholder: 'AKIA...' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 5 }}>
                  {f.label}
                </label>
                <input type="password" className="input" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12 }} placeholder={f.placeholder} />
              </div>
            ))}
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
              <Key size={13} /> Save Keys
            </button>
          </div>
        </Panel>

        {/* About */}
        <Panel title="About DataHarvest">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['Version',    '2.0.0'],
              ['React',      '19'],
              ['TanStack',   'Router + Query'],
              ['Tailwind',   'v4'],
              ['Flask',      '3.0.3'],
              ['Celery',     '5.4.0'],
              ['Playwright', '1.45.1'],
              ['Pandas',     '2.2.2'],
              ['TensorFlow', '2.17.0'],
              ['Prophet',    '1.1.5'],
            ].map(([lib, ver]) => (
              <div key={lib} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: 'var(--surface-el)' }}>
                <span style={{ fontSize: 12, color: 'var(--brand)', fontFamily: 'JetBrains Mono,monospace', fontWeight: 500 }}>{lib}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'JetBrains Mono,monospace' }}>v{ver}</span>
              </div>
            ))}
          </div>
          {/* Tutorial */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>Tutorial de inicio</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  Vuelve a ver la guía de bienvenida
                </p>
              </div>
              <button className="btn btn-secondary" onClick={resetTours}>
                Ver tutorial otra vez
              </button>
            </div>
          </div>
        </Panel>

      </div>
    </div>
  )
}