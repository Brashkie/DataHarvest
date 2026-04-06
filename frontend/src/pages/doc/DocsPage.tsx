import { useState, useEffect, useRef } from 'react'
import {
  X, ChevronRight, ChevronDown, BookOpen, Zap, Layers, BarChart2,
  Brain, FileText, Activity, Shield, Cpu, HelpCircle,
  Database, ArrowRight, Download, Menu, Home, ArrowLeft,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────── */
interface TocItem { id: string; label: string; depth: 1 | 2 }
interface Page {
  id: string
  title: string
  breadcrumb: string
  toc: TocItem[]
  content: () => React.ReactElement
}
interface SidebarGroup {
  label: string
  icon: typeof BookOpen
  items: { id: string; label: string }[]
}

/* ─────────────────────────────────────────────────────
   SIDEBAR STRUCTURE
───────────────────────────────────────────────────── */
const SIDEBAR: SidebarGroup[] = [
  {
    label: 'Introducción',
    icon: BookOpen,
    items: [
      { id: 'intro', label: '¿Qué es DataHarvest?' },
      { id: 'how-it-works', label: 'Cómo funciona' },
    ],
  },
  {
    label: 'Módulos',
    icon: Zap,
    items: [
      { id: 'modules', label: 'Visión general' },
      { id: 'scraping', label: 'Extracción de datos' },
      { id: 'data-flow', label: 'Recorrido de los datos' },
    ],
  },
  {
    label: 'Avanzado',
    icon: Brain,
    items: [
      { id: 'ai', label: 'Inteligencia Artificial' },
      { id: 'export', label: 'Exportar resultados' },
      { id: 'security', label: 'Privacidad y seguridad' },
    ],
  },
  {
    label: 'Referencia',
    icon: Cpu,
    items: [
      { id: 'tech', label: 'Tecnologías' },
      { id: 'use-cases', label: 'Casos de uso' },
      { id: 'faq', label: 'Preguntas frecuentes' },
    ],
  },
]

const PAGE_ORDER = [
  'intro', 'how-it-works', 'modules', 'scraping', 'data-flow',
  'ai', 'export', 'security', 'tech', 'use-cases', 'faq',
]

/* ─────────────────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────────────────── */
function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[2.25rem] font-bold mb-5 leading-tight"
      style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>
      {children}
    </h1>
  )
}
function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold mt-10 mb-3"
      style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)', scrollMarginTop: '80px' }}>
      {children}
    </h2>
  )
}
function H3({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-lg font-semibold mt-7 mb-2"
      style={{ color: 'var(--text-1)', scrollMarginTop: '80px' }}>
      {children}
    </h3>
  )
}
function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base leading-7 mb-4" style={{ color: 'var(--text-2)' }}>
      {children}
    </p>
  )
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mb-5 space-y-1">{children}</ul>
}
function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-base leading-7" style={{ color: 'var(--text-2)' }}>
      <ChevronRight size={14} className="mt-1 shrink-0" style={{ color: 'var(--brand)' }} />
      <span>{children}</span>
    </li>
  )
}

function InfoCard({ icon: Icon, title, children, accent = 'var(--brand)' }: {
  icon: typeof BookOpen; title: string; children: React.ReactNode; accent?: string
}) {
  return (
    <div className="rounded-xl p-5 mb-4"
      style={{
        background: `color-mix(in srgb,${accent} 6%,var(--surface-el))`,
        border: `1px solid color-mix(in srgb,${accent} 22%,var(--border))`,
      }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} style={{ color: accent }} />
        <span className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{title}</span>
      </div>
      <div className="text-base leading-7" style={{ color: 'var(--text-2)' }}>{children}</div>
    </div>
  )
}

function StepFlow({ steps }: { steps: { label: string; sub: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2 my-5">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center px-4 py-2.5 rounded-xl text-center min-w-[88px]"
            style={{ background: 'var(--surface-el)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
              {i + 1}
            </span>
            <span className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-1)' }}>{s.label}</span>
            <span className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.sub}</span>
          </div>
          {i < steps.length - 1 && <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />}
        </div>
      ))}
    </div>
  )
}

function TechPill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium"
      style={{ background: 'var(--surface-el)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
      {name}
    </span>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: '1px solid var(--border)' }}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left text-base font-medium"
        style={{ background: open ? 'var(--surface-el)' : 'var(--surface)', color: 'var(--text-1)' }}
        onClick={() => setOpen(!open)}>
        {q}
        <ChevronDown size={15} style={{
          color: 'var(--text-3)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 180ms',
          flexShrink: 0,
          marginLeft: '12px',
        }} />
      </button>
      {open && (
        <div className="px-5 py-4 text-base leading-7"
          style={{ background: 'var(--surface)', color: 'var(--text-2)' }}>
          {a}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   PAGE CONTENTS
───────────────────────────────────────────────────── */
const PAGES: Record<string, Page> = {

  intro: {
    id: 'intro', title: '¿Qué es DataHarvest?', breadcrumb: 'Introducción',
    toc: [
      { id: 'para-quien', label: '¿Para quién es útil?', depth: 1 },
      { id: 'proceso', label: 'Proceso completo', depth: 1 },
    ],
    content: () => (
      <>
        <H1>¿Qué es DataHarvest?</H1>
        <P>DataHarvest es una plataforma digital que permite recolectar información de sitios web de
          forma automática, organizarla, analizarla y convertirla en reportes o archivos listos para
          usar — sin necesidad de saber programación.</P>
        <P>Imagina que necesitas conocer el precio de 500 productos en una tienda online, recopilar
          las noticias de los últimos 30 días de varios periódicos, o comparar ofertas de trabajo en
          múltiples plataformas. Hacerlo manualmente tomaría días. DataHarvest lo hace en minutos.</P>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          {[
            { icon: Database, label: 'Recolecta datos', sub: 'De cualquier sitio web', color: '#3b82f6' },
            { icon: BarChart2, label: 'Los analiza', sub: 'Gráficos e IA', color: '#8b5cf6' },
            { icon: Download, label: 'Los exporta', sub: 'Excel, PDF y más', color: '#10b981' },
          ].map(({ icon: Icon, label, sub, color }) => (
            <div key={label} className="rounded-xl p-5 flex flex-col items-center text-center gap-3"
              style={{
                background: `color-mix(in srgb,${color} 8%,var(--surface-el))`,
                border: `1px solid color-mix(in srgb,${color} 25%,var(--border))`,
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `color-mix(in srgb,${color} 20%,transparent)` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <span className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{label}</span>
              <span className="text-sm" style={{ color: 'var(--text-3)' }}>{sub}</span>
            </div>
          ))}
        </div>

        <H2 id="para-quien">¿Para quién es útil?</H2>
        <Ul>
          <Li>Empresas que necesitan monitorear precios de la competencia</Li>
          <Li>Investigadores que recopilan información de portales públicos</Li>
          <Li>Equipos de marketing que analizan tendencias en medios</Li>
          <Li>Analistas que construyen bases de datos de múltiples fuentes</Li>
          <Li>Cualquier persona que necesite datos disponibles en internet</Li>
        </Ul>

        <H2 id="proceso">Proceso completo</H2>
        <P>El usuario elige un sitio, el sistema detecta el mejor motor, extrae la información
          automáticamente, la organiza y la entrega lista para usar.</P>
        <StepFlow steps={[
          { label: 'Elige URL', sub: 'Sitio web' },
          { label: 'Detecta', sub: 'Auto análisis' },
          { label: 'Extrae', sub: 'Scraping' },
          { label: 'Procesa', sub: 'Limpia datos' },
          { label: 'Exporta', sub: 'CSV / PDF' },
        ]} />
      </>
    ),
  },

  'how-it-works': {
    id: 'how-it-works', title: 'Cómo funciona', breadcrumb: 'Introducción',
    toc: [
      { id: 'architecture', label: 'Las 4 capas', depth: 1 },
      { id: 'visual-part', label: 'La parte visual', depth: 2 },
      { id: 'backend', label: 'El servidor', depth: 2 },
      { id: 'background', label: 'Tareas en segundo plano', depth: 2 },
    ],
    content: () => (
      <>
        <H1>Cómo funciona por dentro</H1>
        <P>DataHarvest está dividido en dos grandes partes: la interfaz visual (lo que ves) y
          el motor interno (el trabajo pesado). Ambas trabajan juntas de forma transparente.</P>

        <H2 id="architecture">Las 4 capas del sistema</H2>
        <P>Solo ves la primera capa. Las demás trabajan automáticamente en el fondo.</P>
        <div className="space-y-2 my-5">
          {[
            { layer: 'Tú — el usuario', sub: 'Accedes desde cualquier navegador web', color: '#3b82f6' },
            { layer: 'Interfaz visual (Frontend)', sub: 'React 19 · Gráficos · Editor de pipelines', color: '#8b5cf6' },
            { layer: 'Servidor (Backend)', sub: 'Flask · Seguridad · API · WebSocket', color: '#f59e0b' },
            { layer: 'Tareas en segundo plano', sub: 'Celery · Scraping · IA · Exportación', color: '#10b981' },
          ].map(({ layer, sub, color }, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4 rounded-xl"
              style={{
                background: `color-mix(in srgb,${color} 6%,var(--surface-el))`,
                border: `1px solid color-mix(in srgb,${color} 22%,var(--border))`,
                marginLeft: `${i * 18}px`,
              }}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-base font-medium" style={{ color: 'var(--text-1)' }}>{layer}</span>
              <span className="text-sm" style={{ color: 'var(--text-3)' }}>— {sub}</span>
            </div>
          ))}
        </div>

        <H2 id="visual-part">La parte visual</H2>
        <P>La interfaz de DataHarvest es un panel de control moderno con menú lateral para navegar
          entre módulos, tema oscuro/claro, gráficos interactivos y tablas que puedes filtrar con
          un clic. Funciona desde cualquier navegador web sin instalación.</P>

        <H2 id="backend">El servidor interno</H2>
        <P>Detrás de la interfaz hay un servidor que recibe tus peticiones, las procesa y devuelve
          resultados. No necesitas instalarlo — ya está configurado y funcionando.</P>

        <H2 id="background">Tareas en segundo plano</H2>
        <P>Cuando solicitas un scraping grande o el análisis de miles de registros, DataHarvest
          no te hace esperar. El trabajo se ejecuta en segundo plano con Celery + Redis y
          puedes ver el progreso en tiempo real desde el módulo Monitor.</P>
      </>
    ),
  },

  modules: {
    id: 'modules', title: 'Módulos del sistema', breadcrumb: 'Módulos',
    toc: [
      { id: 'mod-dashboard', label: 'Dashboard', depth: 1 },
      { id: 'mod-scraper', label: 'Web Scraper', depth: 1 },
      { id: 'mod-pipelines', label: 'Pipelines', depth: 1 },
      { id: 'mod-analytics', label: 'Analytics', depth: 1 },
      { id: 'mod-tables', label: 'Tablas de datos', depth: 1 },
      { id: 'mod-ai', label: 'IA / ML Studio', depth: 1 },
      { id: 'mod-reports', label: 'Reportes', depth: 1 },
      { id: 'mod-monitor', label: 'Monitor', depth: 1 },
    ],
    content: () => (
      <>
        <H1>Módulos del sistema</H1>
        <P>DataHarvest está organizado en módulos especializados. Cada uno tiene una función
          específica y se accede desde el menú lateral izquierdo.</P>
        {[
          { id: 'mod-dashboard', icon: Activity, color: '#3b82f6', title: 'Dashboard — Panel principal',
            desc: 'Primera pantalla al entrar. Muestra un resumen completo: datos recolectados hoy, trabajos activos, gráficos del rendimiento y accesos rápidos a las funciones más usadas.' },
          { id: 'mod-scraper', icon: Database, color: '#8b5cf6', title: 'Web Scraper — Recolector de datos',
            desc: 'El módulo más importante. Indica qué sitio analizar, configura qué extraer (precios, títulos, fechas) y el sistema hace el resto. Ves los resultados mientras el proceso avanza.' },
          { id: 'mod-pipelines', icon: Layers, color: '#f59e0b', title: 'Pipelines — Flujos automáticos',
            desc: 'Crea cadenas de tareas automáticas: "cada lunes a las 8am, recolecta precios, limpia los datos y envíalos a Google Sheets". Se configura una vez y funciona solo.' },
          { id: 'mod-analytics', icon: BarChart2, color: '#10b981', title: 'Analytics — Análisis de datos',
            desc: 'Genera gráficos automáticos, encuentra patrones y tendencias, detecta valores anómalos y permite hacer consultas simples sobre los datos.' },
          { id: 'mod-tables', icon: FileText, color: '#06b6d4', title: 'Tablas de datos',
            desc: 'Vista de todos los datos en formato tabla, como Excel pero más potente. Ordena, filtra, busca y edita. También sube archivos CSV, Excel o JSON propios.' },
          { id: 'mod-ai', icon: Brain, color: '#ec4899', title: 'IA / ML Studio',
            desc: 'El módulo más avanzado. Entrena modelos de predicción: predecir precios, clasificar noticias por tema, estimar ventas futuras.' },
          { id: 'mod-reports', icon: Download, color: '#f97316', title: 'Reportes y Exportación',
            desc: 'Genera reportes profesionales en PDF, descarga datos en Excel, CSV u otros formatos. Los reportes incluyen gráficos, tablas y resúmenes ejecutivos.' },
          { id: 'mod-monitor', icon: Activity, color: '#84cc16', title: 'Monitor del sistema',
            desc: 'Panel técnico en tiempo real: consumo de CPU y memoria, trabajos activos, cola de tareas pendientes y registro de actividad del sistema.' },
        ].map(m => (
          <InfoCard key={m.id} icon={m.icon} title={m.title} accent={m.color}>
            <p id={m.id}>{m.desc}</p>
          </InfoCard>
        ))}
      </>
    ),
  },

  scraping: {
    id: 'scraping', title: 'Extracción de datos', breadcrumb: 'Módulos',
    toc: [
      { id: 'why-methods', label: '¿Por qué diferentes métodos?', depth: 1 },
      { id: 'methods', label: 'Métodos disponibles', depth: 1 },
      { id: 'data-types', label: 'Tipos de datos', depth: 1 },
    ],
    content: () => (
      <>
        <H1>Extracción de datos</H1>
        <P>La extracción de datos ("scraping") es el proceso de visitar un sitio web automáticamente
          y recoger la información que necesitas. DataHarvest tiene varios métodos y elige el más
          adecuado según el tipo de sitio.</P>

        <H2 id="why-methods">¿Por qué hay diferentes métodos?</H2>
        <P>No todos los sitios web son iguales. Algunos son páginas simples; otros son aplicaciones
          complejas con animaciones y sistemas de protección anti-bots. DataHarvest adapta su método
          según el sitio objetivo.</P>

        <H2 id="methods">Métodos disponibles</H2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
          {[
            { name: 'Playwright', stars: 4, use: 'Sitios con JavaScript', color: '#8b5cf6',
              desc: 'Navegador invisible que visita el sitio como una persona: hace clic, rellena formularios, espera a que cargue el contenido.' },
            { name: 'Selenium', stars: 3, use: 'Formularios complejos', color: '#f59e0b',
              desc: 'Similar a Playwright, ideal para flujos que requieren interacción compleja.' },
            { name: 'Requests', stars: 5, use: 'Páginas rápidas / estáticas', color: '#10b981',
              desc: 'Método más veloz. Perfecto para sitios de noticias, Wikipedia y páginas de gobierno.' },
            { name: 'CloudScraper', stars: 4, use: 'Sitios protegidos', color: '#3b82f6',
              desc: 'Se "disfraza" de navegador humano para acceder a sitios con protección Cloudflare.' },
            { name: 'Auto ✦', stars: 5, use: 'Selección automática', color: '#ec4899',
              desc: 'Analiza el sitio y elige automáticamente el mejor método. Es la opción por defecto.' },
          ].map(m => (
            <div key={m.name} className="rounded-xl p-4"
              style={{ background: 'var(--surface-el)', border: `1px solid color-mix(in srgb,${m.color} 25%,var(--border))` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base font-bold" style={{ color: m.color }}>{m.name}</span>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{'★'.repeat(m.stars)}{'☆'.repeat(5 - m.stars)}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `color-mix(in srgb,${m.color} 15%,transparent)`, color: m.color }}>
                  {m.use}
                </span>
              </div>
              <p className="text-sm leading-6" style={{ color: 'var(--text-3)' }}>{m.desc}</p>
            </div>
          ))}
        </div>

        <H2 id="data-types">¿Qué tipo de datos puede extraer?</H2>
        <div className="flex flex-wrap gap-2 my-4">
          {['Textos y títulos', 'Precios', 'Tablas completas', 'Imágenes', 'Listas de enlaces',
            'Valoraciones', 'Estadísticas', 'Coordenadas', 'Bases de datos públicas'].map(t => (
            <TechPill key={t} name={t} />
          ))}
        </div>
      </>
    ),
  },

  'data-flow': {
    id: 'data-flow', title: 'Recorrido de los datos', breadcrumb: 'Módulos',
    toc: [
      { id: 'step1', label: '1. El sitio web', depth: 1 },
      { id: 'step2', label: '2. Extracción', depth: 1 },
      { id: 'step3', label: '3. Limpieza', depth: 1 },
      { id: 'step4', label: '4. Análisis', depth: 1 },
      { id: 'step5', label: '5. Entrega', depth: 1 },
    ],
    content: () => (
      <>
        <H1>Recorrido de los datos</H1>
        <P>Una vez que DataHarvest extrae los datos de un sitio web, estos pasan por varias
          etapas antes de llegar a tus manos en un formato limpio y listo para usar.</P>
        <StepFlow steps={[
          { label: 'Sitio Web', sub: 'Origen' },
          { label: 'Extracción', sub: 'Playwright / Requests' },
          { label: 'Limpieza', sub: 'Pandas / Polars' },
          { label: 'Análisis', sub: 'Gráficos / IA' },
          { label: 'Entrega', sub: 'CSV / PDF / Excel' },
        ]} />
        {[
          { id: 'step1', title: '1. El sitio web',
            text: 'Todo empieza en el sitio web de origen. Puede ser una tienda, un portal de noticias, un directorio de empresas, redes sociales o cualquier página accesible desde un navegador.' },
          { id: 'step2', title: '2. Extracción',
            text: 'DataHarvest visita el sitio automáticamente y "lee" su contenido, igual que lo haría una persona pero mucho más rápido. Puede procesar cientos de páginas en pocos minutos.' },
          { id: 'step3', title: '3. Limpieza y organización',
            text: 'Los datos crudos suelen venir desordenados. DataHarvest los limpia automáticamente: estandariza fechas, convierte monedas, elimina duplicados y rellena valores vacíos.' },
          { id: 'step4', title: '4. Análisis',
            text: 'Con los datos limpios, el sistema puede generar gráficos, calcular promedios, comparar períodos de tiempo, detectar anomalías y hacer predicciones con inteligencia artificial.' },
          { id: 'step5', title: '5. Entrega',
            text: 'Los datos procesados se entregan en el formato que necesites: Excel, informe PDF, JSON para bases de datos, o visualizaciones interactivas en pantalla.' },
        ].map(s => (
          <div key={s.id}><H3 id={s.id}>{s.title}</H3><P>{s.text}</P></div>
        ))}
      </>
    ),
  },

  ai: {
    id: 'ai', title: 'Inteligencia Artificial', breadcrumb: 'Avanzado',
    toc: [
      { id: 'forecasting', label: 'Predicciones', depth: 1 },
      { id: 'classification', label: 'Clasificación', depth: 1 },
      { id: 'anomaly', label: 'Detección de anomalías', depth: 1 },
      { id: 'clustering', label: 'Segmentación', depth: 1 },
    ],
    content: () => (
      <>
        <H1>Inteligencia Artificial</H1>
        <P>DataHarvest incluye herramientas de IA que permiten extraer conocimiento más profundo
          de los datos recolectados. No es magia, es matemática aplicada a patrones en los datos.</P>
        <InfoCard icon={BarChart2} title="Predicciones (Forecasting)" accent="#3b82f6">
          <p id="forecasting">Si tienes datos históricos — ventas del último año, precios de los últimos 6 meses,
            visitas a un sitio — la IA puede predecir cómo evolucionarán. Usa <strong>Prophet</strong> (Meta/Facebook),
            diseñado para series de tiempo con estacionalidad.</p>
        </InfoCard>
        <InfoCard icon={FileText} title="Clasificación automática" accent="#8b5cf6">
          <p id="classification">Puede leer miles de textos (noticias, reseñas) y clasificarlos por categoría,
            sentimiento (positivo/negativo) o cualquier criterio que definas. Útil para monitoreo de marca.</p>
        </InfoCard>
        <InfoCard icon={Activity} title="Detección de anomalías" accent="#ef4444">
          <p id="anomaly">Identifica datos que se salen de lo normal: un precio que bajó 80% de golpe,
            un producto que desapareció del catálogo, un pico inusual de actividad.</p>
        </InfoCard>
        <InfoCard icon={Layers} title="Segmentación (Clustering)" accent="#10b981">
          <p id="clustering">Agrupa automáticamente datos similares sin definir los grupos de antemano.
            Por ejemplo: clientes por comportamiento de compra, o productos por precio y categoría.</p>
        </InfoCard>
        <div className="rounded-xl p-5 mt-4"
          style={{ background: 'color-mix(in srgb,var(--brand) 6%,var(--surface-el))', border: '1px solid color-mix(in srgb,var(--brand) 20%,var(--border))' }}>
          <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-1)' }}>¿Es difícil de usar?</p>
          <P>No. Seleccionas los datos, eliges el tipo de análisis y el sistema se encarga de todo
            lo técnico. Los resultados se muestran en gráficos claros con explicaciones en lenguaje simple.</P>
        </div>
      </>
    ),
  },

  export: {
    id: 'export', title: 'Exportar resultados', breadcrumb: 'Avanzado',
    toc: [
      { id: 'formats', label: 'Formatos disponibles', depth: 1 },
      { id: 'cloud', label: 'Integración con la nube', depth: 1 },
    ],
    content: () => (
      <>
        <H1>Exportar resultados</H1>
        <P>Toda la información recolectada y analizada puede exportarse en múltiples formatos
          para compartirla, importarla en otras herramientas o archivarla.</P>
        <H2 id="formats">Formatos disponibles</H2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
          {[
            { fmt: 'Excel (.xlsx)', desc: 'El más universal. Incluye hojas con datos, tablas y gráficos.', color: '#10b981' },
            { fmt: 'PDF', desc: 'Listo para imprimir o compartir, con diseño profesional.', color: '#ef4444' },
            { fmt: 'CSV', desc: 'Compatible con Excel, Google Sheets, Python, R y bases de datos.', color: '#3b82f6' },
            { fmt: 'JSON', desc: 'Estándar para intercambio entre sistemas y aplicaciones.', color: '#f59e0b' },
            { fmt: 'Parquet', desc: 'Alta eficiencia para grandes volúmenes. Ideal para Big Data.', color: '#8b5cf6' },
          ].map(({ fmt, desc, color }) => (
            <div key={fmt} className="rounded-xl p-5"
              style={{ background: 'var(--surface-el)', border: '1px solid var(--border)' }}>
              <span className="inline-flex px-2.5 py-1 rounded-lg text-sm font-bold mb-3 block"
                style={{ background: `color-mix(in srgb,${color} 15%,transparent)`, color, width: 'fit-content' }}>
                {fmt}
              </span>
              <P>{desc}</P>
            </div>
          ))}
        </div>
        <H2 id="cloud">Integración con la nube</H2>
        <Ul>
          <Li><strong>Google BigQuery</strong> — análisis a gran escala</Li>
          <Li><strong>Amazon S3</strong> — almacenamiento de objetos</Li>
          <Li><strong>Google Cloud Storage</strong> — archivos en la nube de Google</Li>
        </Ul>
      </>
    ),
  },

  security: {
    id: 'security', title: 'Privacidad y seguridad', breadcrumb: 'Avanzado',
    toc: [
      { id: 'access-sec', label: 'Seguridad de acceso', depth: 1 },
      { id: 'responsible', label: 'Uso responsable', depth: 1 },
      { id: 'data-prot', label: 'Protección de datos', depth: 1 },
    ],
    content: () => (
      <>
        <H1>Privacidad y seguridad</H1>
        <P>DataHarvest incluye múltiples capas de seguridad para proteger el acceso al sistema
          y garantizar el uso responsable de internet.</P>
        <H2 id="access-sec">Seguridad de acceso</H2>
        <Ul>
          <Li>Sistema de usuario y contraseña con tokens de sesión <strong>(JWT)</strong></Li>
          <Li>Contraseñas almacenadas cifradas — ni administradores pueden verlas en texto plano</Li>
          <Li>Sesiones que expiran automáticamente para prevenir accesos no autorizados</Li>
        </Ul>
        <H2 id="responsible">Uso responsable de internet</H2>
        <Ul>
          <Li>Respeto a los tiempos de espera entre peticiones para no sobrecargar servidores</Li>
          <Li>Compatible con <code className="px-1.5 py-0.5 rounded text-sm" style={{ background: 'var(--surface-el)', fontFamily: 'var(--font-mono)' }}>robots.txt</code></Li>
          <Li>Diseñado para sitios con acceso público o con las credenciales correspondientes</Li>
        </Ul>
        <H2 id="data-prot">Protección de los datos recolectados</H2>
        <Ul>
          <Li>Datos almacenados localmente en la infraestructura del usuario, no en servidores de terceros</Li>
          <Li>Acceso restringido — solo el servidor de DataHarvest puede leer y escribir los datos</Li>
        </Ul>
      </>
    ),
  },

  tech: {
    id: 'tech', title: 'Tecnologías', breadcrumb: 'Referencia',
    toc: [
      { id: 'frontend-tech', label: 'Interfaz visual', depth: 1 },
      { id: 'backend-tech', label: 'Servidor', depth: 1 },
      { id: 'data-tech', label: 'Procesamiento de datos', depth: 1 },
      { id: 'ai-tech', label: 'Inteligencia Artificial', depth: 1 },
    ],
    content: () => (
      <>
        <H1>Tecnologías</H1>
        <P>DataHarvest está construido con herramientas de nivel empresarial, las mismas que usan
          Netflix, Spotify, Airbnb y grandes laboratorios de datos.</P>
        {[
          {
            id: 'frontend-tech', title: 'Interfaz visual',
            pills: ['React 19', 'TypeScript', 'TailwindCSS', 'TanStack Router', 'Recharts', 'ReactFlow'],
            rows: [
              { name: 'React 19', desc: 'La librería de Meta para crear interfaces de usuario.' },
              { name: 'Tailwind CSS', desc: 'Sistema de estilos. Define colores, tamaños y espacios.' },
              { name: 'Recharts', desc: 'Genera diagramas de barras, líneas y áreas.' },
              { name: 'ReactFlow', desc: 'Editor visual de pipelines — arrastra y conecta bloques.' },
            ],
          },
          {
            id: 'backend-tech', title: 'Servidor',
            pills: ['Flask (Python)', 'Celery', 'Redis', 'PostgreSQL', 'JWT'],
            rows: [
              { name: 'Flask (Python)', desc: 'Servidor web que recibe peticiones y devuelve resultados.' },
              { name: 'Celery + Redis', desc: 'Sistema de cola de tareas para trabajos en segundo plano.' },
              { name: 'PostgreSQL', desc: 'Base de datos robusta para todos los datos del sistema.' },
            ],
          },
          {
            id: 'data-tech', title: 'Procesamiento de datos',
            pills: ['Pandas', 'Polars', 'NumPy', 'DuckDB', 'Apache Spark'],
            rows: [
              { name: 'Pandas y Polars', desc: 'Manipulación de tablas — Excel ultra-potente.' },
              { name: 'NumPy', desc: 'Cálculos estadísticos de alta velocidad.' },
              { name: 'Apache Spark', desc: 'Para volúmenes masivos de datos (Big Data).' },
            ],
          },
          {
            id: 'ai-tech', title: 'Inteligencia Artificial',
            pills: ['TensorFlow', 'XGBoost', 'Prophet', 'scikit-learn'],
            rows: [
              { name: 'TensorFlow', desc: 'Framework de IA de Google para deep learning.' },
              { name: 'XGBoost', desc: 'Algoritmo de predicción premiado en data science.' },
              { name: 'Prophet', desc: 'Predicción de series temporales (Meta/Facebook).' },
              { name: 'scikit-learn', desc: 'Algoritmos clásicos: clasificación, clustering, regresión.' },
            ],
          },
        ].map(section => (
          <div key={section.id}>
            <H2 id={section.id}>{section.title}</H2>
            <div className="flex flex-wrap gap-2 mb-4">{section.pills.map(p => <TechPill key={p} name={p} />)}</div>
            <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
              {section.rows.map((r, i) => (
                <div key={r.name} className="flex items-start gap-4 px-5 py-3"
                  style={{ background: i % 2 === 0 ? 'var(--surface-el)' : 'var(--surface)', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <span className="text-sm font-semibold w-36 shrink-0 pt-0.5"
                    style={{ color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>{r.name}</span>
                  <span className="text-sm leading-6" style={{ color: 'var(--text-2)' }}>{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    ),
  },

  'use-cases': {
    id: 'use-cases', title: 'Casos de uso', breadcrumb: 'Referencia',
    toc: [
      { id: 'uc1', label: 'Monitoreo de precios', depth: 1 },
      { id: 'uc2', label: 'Seguimiento de medios', depth: 1 },
      { id: 'uc3', label: 'Investigación académica', depth: 1 },
      { id: 'uc4', label: 'Directorio de empresas', depth: 1 },
      { id: 'uc5', label: 'Disponibilidad de productos', depth: 1 },
    ],
    content: () => (
      <>
        <H1>Casos de uso reales</H1>
        <P>Ejemplos concretos de cómo DataHarvest resuelve problemas reales en distintos sectores.</P>
        {[
          { id: 'uc1', n: 1, title: 'Monitoreo de precios en e-commerce',
            desc: 'Una empresa necesita conocer diariamente los precios de 200 productos de sus 5 competidores. Configurar un pipeline en DataHarvest que corra cada mañana, extraiga esos 1,000 precios y genere un informe en Excel toma ~20 minutos. Después, el sistema lo hace solo todos los días.' },
          { id: 'uc2', n: 2, title: 'Seguimiento de noticias y medios',
            desc: 'Un equipo de comunicación quiere monitorear cuántas veces aparece su marca en medios digitales y con qué tono. DataHarvest recolecta artículos de 50 medios diariamente, los clasifica con IA según sentimiento y genera un resumen semanal automático.' },
          { id: 'uc3', n: 3, title: 'Investigación académica o de mercado',
            desc: 'Un investigador necesita datos de un portal público de estadísticas gubernamentales sin API ni opción de descarga masiva. DataHarvest extrae, limpia y estructura esos datos en un formato analizable.' },
          { id: 'uc4', n: 4, title: 'Directorio de empresas o profesionales',
            desc: 'Se necesita una base de datos de 5,000 restaurantes con nombre, dirección, horarios, calificación y teléfono. DataHarvest los recolecta de directorios públicos y los entrega organizados en Excel.' },
          { id: 'uc5', n: 5, title: 'Control de disponibilidad de productos',
            desc: 'Una empresa de retail quiere saber en tiempo real cuando un producto de su competidor se agota o vuelve a estar disponible. DataHarvest revisa esas páginas cada hora y envía una alerta automática.' },
        ].map(uc => (
          <div key={uc.id} id={uc.id} className="rounded-xl px-5 py-4 mb-4"
            style={{ background: 'var(--surface-el)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'color-mix(in srgb,var(--brand) 15%,transparent)', color: 'var(--brand)' }}>
                #{uc.n}
              </span>
              <span className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{uc.title}</span>
            </div>
            <P>{uc.desc}</P>
          </div>
        ))}
      </>
    ),
  },

  faq: {
    id: 'faq', title: 'Preguntas frecuentes', breadcrumb: 'Referencia',
    toc: [],
    content: () => (
      <>
        <H1>Preguntas frecuentes</H1>
        <P>Respuestas a las dudas más comunes sobre DataHarvest.</P>
        <div className="mt-4">
          {[
            { q: '¿Necesito saber programación para usar DataHarvest?',
              a: 'No. La interfaz está diseñada para que cualquier persona pueda usarla. Configuras lo que quieres extraer con formularios y clics. Para funciones avanzadas de IA, el sistema guía el proceso paso a paso.' },
            { q: '¿Es legal recolectar datos de sitios web?',
              a: 'Depende del sitio y el uso. Recolectar información pública para uso personal o investigación generalmente es legal. Para uso comercial revisa los términos de servicio de cada sitio. DataHarvest respeta robots.txt y no sobrecarga servidores.' },
            { q: '¿Cuántos datos puede manejar el sistema?',
              a: 'En configuración estándar: cientos de miles de registros. Con Big Data (Apache Spark + BigQuery): millones o miles de millones de registros.' },
            { q: '¿Con qué frecuencia puede correr automáticamente?',
              a: 'Con pipelines programados puede ejecutarse con cualquier frecuencia usando el estándar cron: cada minuto, hora, día, semana, mes — cualquier combinación.' },
            { q: '¿Funciona con sitios que requieren login?',
              a: 'Sí. Soporta autenticación con usuario/contraseña, tokens de sesión y cookies, permitiendo acceso a portales privados con las credenciales correspondientes.' },
            { q: '¿Los datos son seguros?',
              a: 'Sí. Todo se almacena en la infraestructura propia del usuario. Nada se envía a servidores externos sin tu conocimiento. El acceso está protegido con JWT.' },
            { q: '¿Qué pasa si el sitio cambia su diseño?',
              a: 'Los selectores pueden necesitar actualización. DataHarvest tiene un modo de detección automática que intenta adaptarse a estos cambios.' },
          ].map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
        </div>

        {/* Author card */}
        <div className="mt-12 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="h-20 w-full"
            style={{ background: 'linear-gradient(135deg, color-mix(in srgb,var(--brand) 40%,transparent), color-mix(in srgb,#8b5cf6 40%,transparent))' }} />
          <div className="px-6 pb-6" style={{ background: 'var(--surface-el)' }}>
            <div className="flex items-end gap-4 -mt-7 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', boxShadow: '0 0 0 4px var(--surface-el)' }}>
                B
              </div>
              <div className="pb-1">
                <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Brashkie</p>
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>Moisés Yaurivilca</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: '⚡ Hepein Oficial', brand: true },
                { label: '📍 Lima, Perú', brand: false },
                { label: '🗓 2025', brand: false },
              ].map(b => (
                <span key={b.label} className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium"
                  style={{
                    background: b.brand ? 'color-mix(in srgb,var(--brand) 12%,transparent)' : 'var(--surface)',
                    border: `1px solid ${b.brand ? 'color-mix(in srgb,var(--brand) 25%,var(--border))' : 'var(--border)'}`,
                    color: b.brand ? 'var(--brand)' : 'var(--text-3)',
                  }}>
                  {b.label}
                </span>
              ))}
            </div>
            <P>Data Analyst en GLOBAL MEGA S.A.C. · Ingeniería de Software con IA en SENATI.
              Construye y publica sistemas web, APIs, paquetes NPM y herramientas de automatización
              bajo la marca independiente <strong style={{ color: 'var(--text-1)' }}>Hepein Oficial</strong>.</P>
            <a href="https://github.com/Brashkie" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              github.com/Brashkie
            </a>
          </div>
        </div>
      </>
    ),
  },
}

/* ─────────────────────────────────────────────────────
   LEFT SIDEBAR COMPONENT
───────────────────────────────────────────────────── */
function LeftSidebar({ current, onNav, onClose }: {
  current: string; onNav: (id: string) => void; onClose?: () => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    SIDEBAR.forEach(g => { init[g.label] = true })
    return init
  })

  return (
    <aside className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

      <div className="h-14 flex items-center gap-3 px-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
          style={{ background: 'linear-gradient(135deg,var(--brand),#8b5cf6)' }}>DH</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>DataHarvest</p>
          <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>Docs v2.0</p>
        </div>
        {onClose && (
          <button className="btn btn-ghost p-1.5 md:hidden" onClick={onClose} style={{ color: 'var(--text-3)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {SIDEBAR.map(group => {
          const Icon = group.icon
          const open = expanded[group.label]
          return (
            <div key={group.label} className="mb-2">
              <button
                onClick={() => setExpanded(e => ({ ...e, [group.label]: !e[group.label] }))}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1 text-left"
                style={{ color: 'var(--text-3)' }}>
                <Icon size={12} />
                <span className="text-xs font-semibold uppercase tracking-wider flex-1">{group.label}</span>
                <ChevronDown size={11} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms' }} />
              </button>
              {open && group.items.map(item => {
                const active = current === item.id
                return (
                  <button key={item.id}
                    onClick={() => { onNav(item.id); onClose?.() }}
                    className="w-full flex items-center px-3 py-2 rounded-lg text-left text-sm font-medium mb-0.5 transition-colors"
                    style={{
                      background: active ? 'color-mix(in srgb,var(--brand) 10%,transparent)' : 'transparent',
                      color: active ? 'var(--brand)' : 'var(--text-2)',
                      borderLeft: active ? '2px solid var(--brand)' : '2px solid transparent',
                    }}>
                    {item.label}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────
   RIGHT TOC
───────────────────────────────────────────────────── */
function RightToc({ items, activeId }: { items: TocItem[]; activeId: string }) {
  if (!items.length) return null
  return (
    <aside className="hidden xl:block w-52 shrink-0 pt-1">
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>
        En esta página
      </p>
      <nav className="space-y-0.5 border-l" style={{ borderColor: 'var(--border)' }}>
        {items.map(item => (
          <a key={item.id} href={`#${item.id}`}
            className="block text-sm py-1 pl-3 transition-colors"
            style={{
              paddingLeft: item.depth === 2 ? '20px' : '12px',
              color: activeId === item.id ? 'var(--brand)' : 'var(--text-3)',
              fontWeight: activeId === item.id ? 600 : 400,
              borderLeft: activeId === item.id ? '2px solid var(--brand)' : '2px solid transparent',
              marginLeft: '-1px',
            }}>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────
   DOCS PAGE — main export
───────────────────────────────────────────────────── */
export function DocsPage({ onClose }: { onClose: () => void }) {
  const [currentId, setCurrentId] = useState('intro')
  const [activeTocId, setActiveTocId] = useState('')
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const page = PAGES[currentId]
  const idx = PAGE_ORDER.indexOf(currentId)
  const prevPage = idx > 0 ? PAGES[PAGE_ORDER[idx - 1]] : null
  const nextPage = idx < PAGE_ORDER.length - 1 ? PAGES[PAGE_ORDER[idx + 1]] : null

  const navigate = (id: string) => {
    setCurrentId(id)
    setActiveTocId('')
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }

  // TOC tracking
  useEffect(() => {
    const el = contentRef.current
    if (!el || !page.toc.length) return
    const handler = () => {
      for (const item of [...page.toc].reverse()) {
        const target = el.querySelector(`#${item.id}`)
        if (target && target.getBoundingClientRect().top <= 100) {
          setActiveTocId(item.id)
          return
        }
      }
      setActiveTocId('')
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [currentId, page.toc])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const Content = page.content

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Navbar */}
      <nav className="h-14 shrink-0 flex items-center gap-3 px-5"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>

        <button className="btn btn-ghost p-2 w-8 h-8 md:hidden"
          onClick={() => setMobileSidebar(true)} style={{ color: 'var(--text-2)' }}>
          <Menu size={16} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
            style={{ background: 'linear-gradient(135deg,var(--brand),#8b5cf6)' }}>DH</div>
          <span className="text-sm font-bold hidden sm:block" style={{ color: 'var(--text-1)' }}>DataHarvest</span>
        </div>

        <span className="text-sm font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: 'color-mix(in srgb,var(--brand) 10%,transparent)', color: 'var(--brand)' }}>
          Docs
        </span>

        <div className="flex-1" />

        <button className="btn btn-ghost p-2 w-8 h-8" onClick={onClose}
          title="Cerrar" style={{ color: 'var(--text-2)' }}>
          <X size={16} />
        </button>
      </nav>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <div className="hidden md:block w-64 shrink-0">
          <LeftSidebar current={currentId} onNav={navigate} />
        </div>

        {/* Mobile sidebar */}
        {mobileSidebar && (
          <div className="fixed inset-0 z-60 md:hidden flex">
            <div className="w-64 h-full">
              <LeftSidebar current={currentId} onNav={navigate} onClose={() => setMobileSidebar(false)} />
            </div>
            <div className="flex-1" style={{ background: 'rgba(0,0,0,0.45)' }}
              onClick={() => setMobileSidebar(false)} />
          </div>
        )}

        {/* Main scroll area */}
        <main ref={contentRef} className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
          <div className="flex max-w-5xl mx-auto px-8 py-10 gap-10">

            {/* Article */}
            <article className="flex-1 min-w-0">

              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 mb-7 text-sm" style={{ color: 'var(--text-3)' }}>
                <Home size={13} />
                <ChevronRight size={11} />
                <span>{page.breadcrumb}</span>
                <ChevronRight size={11} />
                <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{page.title}</span>
              </div>

              {/* Content */}
              <Content />

              {/* Divider */}
              <div className="mt-14 mb-8" style={{ borderTop: '1px solid var(--border)' }} />

              {/* Prev / Next */}
              <div className="flex items-stretch gap-4 mb-12">
                {prevPage ? (
                  <button onClick={() => navigate(prevPage.id)}
                    className="flex-1 flex flex-col items-start px-5 py-4 rounded-xl text-left transition-opacity hover:opacity-75"
                    style={{ background: 'var(--surface-el)', border: '1px solid var(--border)' }}>
                    <span className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                      <ArrowLeft size={11} /> Anterior
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>
                      « {prevPage.title}
                    </span>
                  </button>
                ) : <div className="flex-1" />}

                {nextPage && (
                  <button onClick={() => navigate(nextPage.id)}
                    className="flex-1 flex flex-col items-end px-5 py-4 rounded-xl text-right transition-opacity hover:opacity-75"
                    style={{ background: 'var(--surface-el)', border: '1px solid var(--border)' }}>
                    <span className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                      Siguiente <ChevronRight size={11} />
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>
                      {nextPage.title} »
                    </span>
                  </button>
                )}
              </div>

              <p className="text-xs text-center mb-6" style={{ color: 'var(--text-3)' }}>
                DataHarvest Professional Data Platform v2.0 · Made with ⚡ by Brashkie · Hepein Oficial
              </p>
            </article>

            {/* Right TOC */}
            <RightToc items={page.toc} activeId={activeTocId} />
          </div>
        </main>
      </div>
    </div>
  )
}