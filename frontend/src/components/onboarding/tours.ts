import type { TourConfig } from './types'

export const GENERAL_TOUR: TourConfig = {
  id: 'general',
  steps: [
    {
      target: '.app-shell aside',
      title: '👋 Bienvenido a DataHarvest',
      content: 'Esta es tu barra de navegación. Desde aquí accedes a todos los módulos de la plataforma.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-dashboard"]',
      title: '📊 Dashboard',
      content: 'Ve tus métricas en tiempo real — jobs activos, filas extraídas y estado del sistema.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-scraper"]',
      title: '🌐 Web Scraper',
      content: 'Extrae datos de cualquier web. Solo pega la URL y DataHarvest hace el resto. Sin código.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-pipelines"]',
      title: '🔗 Pipelines ETL',
      content: 'Automatiza flujos de datos con el editor visual. Conecta scraping → análisis → exportación.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-tables"]',
      title: '🗄️ Data Tables',
      content: 'Visualiza, filtra y exporta tus datasets en CSV, Excel o Parquet con un clic.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-analytics"]',
      title: '📈 Analytics',
      content: 'Gráficos automáticos, correlaciones y perfiles EDA. Entiende tus datos al instante.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-ai"]',
      title: '🤖 AI / ML Studio',
      content: 'Entrena modelos predictivos sobre tus datos. XGBoost, Prophet, TensorFlow — sin configuración.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-monitor"]',
      title: '🖥️ Monitor',
      content: 'CPU, memoria, workers de Celery y logs en tiempo real. Todo bajo control.',
      position: 'right',
    },
    {
      target: '[data-tour="connection-status"]',
      title: '🔌 Estado de conexión',
      content: 'Aquí ves si la API y WebSocket están activos. Verde = todo OK. Rojo = revisar backend.',
      position: 'right',
    },
  ],
}

export const DASHBOARD_TOUR: TourConfig = {
  id: 'dashboard',
  steps: [
    {
      target: '[data-tour="kpi-cards"]',
      title: '📊 Métricas en tiempo real',
      content: 'Estas 4 cards muestran el estado global — filas extraídas, jobs activos, tasa de éxito y duración promedio.',
      position: 'bottom',
    },
    {
      target: '[data-tour="chart-rows"]',
      title: '📈 Gráfico de extracción 24h',
      content: 'Volumen de filas scrapeadas por hora. La línea azul muestra el flujo de datos, la roja los errores.',
      position: 'bottom',
    },
    {
      target: '[data-tour="recent-jobs"]',
      title: '🕐 Jobs recientes',
      content: 'Los últimos jobs ejecutados con su estado, motor, filas extraídas y duración. Haz clic para ir al Scraper.',
      position: 'top',
    },
    {
      target: '[data-tour="quick-actions"]',
      title: '⚡ Acciones rápidas',
      content: 'Accesos directos para crear un scraper job, pipeline, análisis o entrenar un modelo.',
      position: 'top',
    },
  ],
}

export const SCRAPER_TOUR: TourConfig = {
  id: 'scraper',
  steps: [
    {
      target: '[data-tour="url-input"]',
      title: '🔗 Paso 1 — Pega tu URL aquí',
      content: '👆 Este campo es tu punto de partida. Pega cualquier URL — tienda, blog, directorio — y DataHarvest extrae los datos automáticamente.',
      position: 'bottom',
    },
    {
      target: '[data-tour="test-btn"]',
      title: '🧪 Paso 2 — Prueba la URL',
      content: 'Antes de crear un job, verifica si la URL es accesible. Te dirá si tiene Cloudflare, JavaScript pesado y qué motor usar.',
      position: 'bottom',
    },
    {
      target: '[data-tour="new-job-btn"]',
      title: '▶️ Paso 3 — Crea tu primer Job',
      content: 'Cuando estés listo, crea el job. Elige el motor de scraping, agrega selectores CSS opcionales y configura opciones avanzadas.',
      position: 'bottom',
    },
    {
      target: '[data-tour="jobs-table"]',
      title: '📋 Paso 4 — Lista de Jobs',
      content: 'Aquí aparecen todos tus jobs con su estado en tiempo real — Pending, Running, Completed o Failed. Puedes cancelar o eliminar desde aquí.',
      position: 'right',
    },
    {
      target: '[data-tour="results-panel"]',
      title: '📊 Paso 5 — Panel de resultados',
      content: 'Haz clic en cualquier job para ver sus datos extraídos, metadata y configuración. Exporta en CSV o copia como JSON.',
      position: 'left',
    },
  ],
}

export const ALL_TOURS: Record<string, TourConfig> = {
  general:   GENERAL_TOUR,
  dashboard: DASHBOARD_TOUR,
  scraper:   SCRAPER_TOUR,
}