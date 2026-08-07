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

export const PIPELINES_TOUR: TourConfig = {
  id: 'pipelines',
  steps: [
    {
      target: '[data-tour="pipeline-list"]',
      title: '📋 Tus pipelines',
      content: 'Aquí ves todos tus pipelines ETL con su estado, cantidad de runs y tasa de éxito. Haz clic en uno para editarlo.',
      position: 'right',
    },
    {
      target: '[data-tour="node-palette"]',
      title: '🧩 Agrega nodos',
      content: 'Scraper, Transform, Filter, Aggregate, AI/ML, Export, Database — haz clic en cualquiera para agregarlo al canvas.',
      position: 'bottom',
    },
    {
      target: '[data-tour="pipeline-canvas"]',
      title: '🔗 Editor visual',
      content: 'Arrastra los nodos y conéctalos para diseñar tu flujo de datos — de scraping a análisis a exportación, sin código.',
      position: 'top',
    },
    {
      target: '[data-tour="pipeline-tabs"]',
      title: '🕐 Historial de ejecuciones',
      content: 'Cambia a "Run History" para ver ejecuciones pasadas con filas procesadas y duración de cada una.',
      position: 'bottom',
    },
  ],
}

export const ANALYTICS_TOUR: TourConfig = {
  id: 'analytics',
  steps: [
    {
      target: '[data-tour="analytics-dataset"]',
      title: '🗂️ Elige tu dataset',
      content: 'Selecciona un dataset de ejemplo o sube tu propio CSV/JSON para empezar a analizarlo.',
      position: 'bottom',
    },
    {
      target: '[data-tour="analytics-profile-btn"]',
      title: '⚡ Auto-Profile',
      content: 'Genera automáticamente un perfil EDA completo — tipos de columna, valores faltantes, distribuciones y correlaciones.',
      position: 'bottom',
    },
    {
      target: '[data-tour="analytics-tabs"]',
      title: '📊 Charts, Profile, SQL y Raw Data',
      content: 'Cuatro vistas de tus datos: gráficos interactivos, perfil estadístico, consultas SQL con DuckDB, y los datos crudos.',
      position: 'bottom',
    },
    {
      target: '[data-tour="analytics-content"]',
      title: '📈 Explora tus datos',
      content: 'Construye gráficos personalizados eligiendo ejes y tipo de visualización — todo se actualiza en tiempo real.',
      position: 'top',
    },
  ],
}

export const TABLES_TOUR: TourConfig = {
  id: 'tables',
  steps: [
    {
      target: '[data-tour="dataset-list"]',
      title: '🗄️ Tus datasets',
      content: 'Todos los datasets que subiste o extrajiste con el scraper aparecen aquí. Haz clic en uno para explorarlo.',
      position: 'right',
    },
    {
      target: '[data-tour="dataset-upload"]',
      title: '📤 Sube un archivo',
      content: 'Importa CSV, Excel o Parquet directamente — DataHarvest detecta el schema automáticamente.',
      position: 'bottom',
    },
    {
      target: '[data-tour="dataset-main"]',
      title: '🔍 Vista de datos',
      content: 'Una vez seleccionado un dataset, aquí verás sus filas, el schema de columnas, un perfil estadístico y podrás correr consultas SQL.',
      position: 'top',
    },
  ],
}

export const AI_TOUR: TourConfig = {
  id: 'ai',
  steps: [
    {
      target: '[data-tour="ai-stats"]',
      title: '🤖 AI / ML Studio',
      content: 'Un vistazo rápido a tus modelos entrenados, cuántos están en producción y su precisión promedio.',
      position: 'bottom',
    },
    {
      target: '[data-tour="models-list"]',
      title: '🧠 Modelos entrenados',
      content: 'Cada modelo muestra su algoritmo, tipo y métricas clave. Haz clic para ver más detalle.',
      position: 'right',
    },
    {
      target: '[data-tour="train-btn"]',
      title: '▶️ Entrena un modelo',
      content: 'Pega tus datos, elige el algoritmo — XGBoost, Random Forest, Prophet — y entrena sin escribir código.',
      position: 'bottom',
    },
    {
      target: '[data-tour="ai-tabs"]',
      title: '🔮 Predict, Forecast, Cluster, Patterns',
      content: 'Corre predicciones con un modelo ya entrenado, pronósticos con Prophet, clustering K-Means o detecta patrones automáticamente.',
      position: 'left',
    },
  ],
}

export const REPORTS_TOUR: TourConfig = {
  id: 'reports',
  steps: [
    {
      target: '[data-tour="format-picker"]',
      title: '📁 Elige el formato',
      content: 'CSV, Excel, JSON, Parquet o un reporte PDF con resumen — el formato que necesites para tu flujo de trabajo.',
      position: 'bottom',
    },
    {
      target: '[data-tour="dataset-picker"]',
      title: '🗂️ Elige el dataset',
      content: 'Selecciona qué dataset quieres exportar de la lista de datos disponibles.',
      position: 'bottom',
    },
    {
      target: '[data-tour="export-btn"]',
      title: '⬇️ Exporta',
      content: 'Dale un nombre de archivo y exporta — la descarga empieza automáticamente cuando esté listo.',
      position: 'top',
    },
  ],
}

export const MONITOR_TOUR: TourConfig = {
  id: 'monitor',
  steps: [
    {
      target: '[data-tour="monitor-stats"]',
      title: '🖥️ Estado del sistema',
      content: 'CPU, memoria, disco y jobs corriendo en este momento — actualizado en tiempo real.',
      position: 'bottom',
    },
    {
      target: '[data-tour="monitor-charts"]',
      title: '📈 Uso de recursos y workers',
      content: 'Historial de CPU/memoria de los últimos 30 muestreos, y cuántos workers de Celery están activos.',
      position: 'bottom',
    },
    {
      target: '[data-tour="active-jobs"]',
      title: '⚙️ Jobs activos',
      content: 'Los scraper jobs que están corriendo ahora mismo, con su motor y estado en vivo.',
      position: 'top',
    },
    {
      target: '[data-tour="app-logs"]',
      title: '📜 Logs en vivo',
      content: 'Stream de logs de la aplicación en tiempo real — útil para debuggear sin salir del navegador.',
      position: 'top',
    },
  ],
}

export const SETTINGS_TOUR: TourConfig = {
  id: 'settings',
  steps: [
    {
      target: '[data-tour="settings-theme"]',
      title: '🎨 Apariencia',
      content: 'Cambia entre modo oscuro y claro cuando quieras.',
      position: 'bottom',
    },
    {
      target: '[data-tour="settings-backend"]',
      title: '🔌 Conexión al backend',
      content: 'Si tu API corre en otra URL o puerto, cámbiala aquí y usa "Test" para verificar la conexión.',
      position: 'bottom',
    },
    {
      target: '[data-tour="settings-tutorial"]',
      title: '🔁 ¿Necesitas repasar algo?',
      content: 'Desde aquí puedes volver a ver el tutorial de bienvenida cuando quieras. ¡Eso es todo — a explorar DataHarvest!',
      position: 'top',
    },
  ],
}

export const ALL_TOURS: Record<string, TourConfig> = {
  general:   GENERAL_TOUR,
  dashboard: DASHBOARD_TOUR,
  scraper:   SCRAPER_TOUR,
  pipelines: PIPELINES_TOUR,
  analytics: ANALYTICS_TOUR,
  tables:    TABLES_TOUR,
  ai:        AI_TOUR,
  reports:   REPORTS_TOUR,
  monitor:   MONITOR_TOUR,
  settings:  SETTINGS_TOUR,
}