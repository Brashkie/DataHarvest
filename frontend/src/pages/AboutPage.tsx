import { Link } from '@tanstack/react-router'
import { ArrowLeft, Zap, Globe, GitBranch, Brain, Database, BarChart3, Shield, Cpu } from 'lucide-react'

const STACK = [
  {
    group: 'Frontend',
    color: '#38bdf8',
    items: [
      { name: 'React 19',           desc: 'UI runtime'                         },
      { name: 'TanStack Start',     desc: 'SSR / fullstack framework'          },
      { name: 'TanStack Router',    desc: 'File-based routing'                 },
      { name: 'TanStack Query',     desc: 'Server state & caching'             },
      { name: 'Zustand 5',          desc: 'Client state'                       },
      { name: 'Tailwind CSS v4',    desc: '@theme tokens, plain CSS classes'   },
      { name: 'Recharts',           desc: 'Charts & dashboards'                },
      { name: 'ReactFlow',          desc: 'Pipeline visual editor'             },
      { name: 'Socket.IO Client',   desc: 'Live job progress'                  },
    ],
  },
  {
    group: 'Backend',
    color: '#a78bfa',
    items: [
      { name: 'Flask 3',            desc: 'REST API + SocketIO'                },
      { name: 'Celery 5 + Redis',   desc: 'Background task queues'            },
      { name: 'Playwright',         desc: 'JS-heavy site scraping'             },
      { name: 'Selenium',           desc: 'Complex browser automation'         },
      { name: 'CloudScraper',       desc: 'Bypass Cloudflare'                  },
      { name: 'Pandas + Polars',    desc: 'Data processing'                    },
      { name: 'TensorFlow + XGBoost', desc: 'ML training & predictions'        },
      { name: 'Prophet',            desc: 'Time-series forecasting'            },
      { name: 'PostgreSQL',         desc: 'Persistent storage'                 },
    ],
  },
]

const FEATURES = [
  { icon: Globe,     label: 'Web Scraper',   desc: '5 engines — Playwright, Selenium, Requests, CloudScraper, Scrapy. Auto-select, stealth mode, Tor, pagination.' },
  { icon: GitBranch, label: 'ETL Pipelines', desc: 'Visual drag-and-drop editor with ReactFlow. Celery-backed execution, real-time WebSocket progress.' },
  { icon: BarChart3, label: 'Analytics',     desc: 'Auto EDA profiling, pattern & anomaly detection, DuckDB SQL, Plotly charts, correlations.' },
  { icon: Database,  label: 'Data Tables',   desc: 'Virtualized grid, sort/filter, SQL queries, upload CSV/JSON/XLSX/Parquet, drag-and-drop.' },
  { icon: Brain,     label: 'AI / ML',       desc: 'Train classifiers & regressors, Prophet forecasting, K-Means clustering, model registry.' },
  { icon: Shield,    label: 'Monitor',       desc: 'Real-time CPU, RAM, disk, Celery stats, live log stream, active job tracker.' },
  { icon: Cpu,       label: 'Exports',       desc: 'CSV, XLSX, JSON, Parquet, PDF reports via ReportLab.' },
]

export function AboutPage() {
  return (
    <div className="min-h-screen overflow-auto" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

        {/* Back */}
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-3)', marginBottom:32, textDecoration:'none' }}>
          <ArrowLeft size={14} /> Back to app
        </Link>

        {/* Hero */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:20, marginBottom:48 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Zap size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:30, fontWeight:700, color:'var(--text-1)', marginBottom:6 }}>
              DataHarvest
            </h1>
            <p style={{ fontSize:15, color:'var(--text-2)', marginBottom:12 }}>
              Professional web scraping, ETL pipelines & analytics platform
            </p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['v2.0.0', 'React 19', 'TanStack Start', 'Tailwind v4', 'Flask 3'].map(t => (
                <span key={t} className="badge badge-blue">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Modules */}
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:600, color:'var(--text-1)', marginBottom:16 }}>Modules</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12, marginBottom:48 }}>
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card" style={{ padding:16, display:'flex', gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'color-mix(in srgb,var(--brand) 12%,transparent)', color:'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={15} />
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', marginBottom:3 }}>{label}</p>
                <p style={{ fontSize:11, color:'var(--text-3)', lineHeight:1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stack */}
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:600, color:'var(--text-1)', marginBottom:16 }}>Tech Stack</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20, marginBottom:48 }}>
          {STACK.map(({ group, color, items }) => (
            <div key={group} className="panel" style={{ overflow:'hidden' }}>
              <div className="panel-header" style={{ background:'var(--surface-el)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:color }} />
                  <span style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--text-3)' }}>{group}</span>
                </div>
              </div>
              {items.map(({ name, desc }) => (
                <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, fontFamily:'JetBrains Mono,monospace', fontWeight:500, color }}>{name}</span>
                  <span style={{ fontSize:11, color:'var(--text-3)' }}>{desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Quick start */}
        <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:600, color:'var(--text-1)', marginBottom:16 }}>Quick Start</h2>
        <div className="code-block" style={{ marginBottom:40 }}>
          {[
            '# Backend',
            'cd backend && pip install -r requirements.txt',
            'playwright install chromium',
            'python run.py                   # Flask API → :5000',
            'celery -A worker.celery worker  # Background tasks',
            '',
            '# Frontend',
            'cd frontend && npm install',
            'npm run dev                     # TanStack Start → :3000',
          ].map((line, i) => (
            <div key={i} style={{ color: line.startsWith('#') ? '#64748b' : '#34d399', lineHeight: 1.7 }}>
              {line || '\u00A0'}
            </div>
          ))}
        </div>

        <p style={{ fontSize:12, color:'var(--text-3)', paddingBottom:32 }}>
          DataHarvest v2.0.0 — React 19 · TanStack Start · Tailwind v4 · Flask 3
        </p>
      </div>
    </div>
  )
}