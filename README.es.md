# DataHarvest Pro v2.0

<div align="center">

![DataHarvest Logo](frontend/public/dataharvest_logo.svg)

**Plataforma profesional de scraping y análisis de datos**

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-black?logo=flask)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis)](https://redis.io)
[![Celery](https://img.shields.io/badge/Celery-5.4-37814a?logo=celery)](https://docs.celeryq.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker)](https://docker.com)

</div>

---

## ¿Qué es DataHarvest?

DataHarvest es una plataforma full-stack para extraer, procesar, analizar y exportar datos de cualquier sitio web. Cuenta con un frontend moderno en React con actualizaciones en tiempo real vía WebSocket, un backend en Flask + Celery para procesamiento en segundo plano, y soporte para múltiples motores de scraping.

## Características principales

- **Scraping multi-motor** — Playwright, Selenium, Requests, CloudScraper con selección automática
- **Progreso en tiempo real** — actualizaciones vía WebSocket mientras los jobs se ejecutan
- **URL Tester inteligente** — detecta Cloudflare, sitios con JS pesado y errores HTTP antes de crear jobs
- **Almacenamiento optimizado** — Parquet (compresión Snappy) + PostgreSQL + Redis
- **Onboarding guiado** — tour con spotlight para usuarios nuevos, guías por módulo
- **Analytics** — perfiles EDA, SQL con DuckDB, Polars para procesamiento de alto rendimiento
- **AI / ML Studio** — entrenamiento de modelos con XGBoost, scikit-learn y TensorFlow
- **Pipelines ETL** — editor visual con ReactFlow
- **Exportación** — CSV, Excel, JSON, Parquet
- **Listo para Docker** — docker-compose completo con todos los servicios

## Stack tecnológico

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19 | Framework de UI |
| TanStack Start | 1.x | Framework SSR |
| TanStack Router | latest | Enrutamiento basado en archivos |
| TanStack Query | latest | Estado del servidor |
| Tailwind CSS | v4 | Estilos |
| Zustand | latest | Estado del cliente |
| Recharts | latest | Visualización de datos |
| Socket.IO Client | latest | Actualizaciones en tiempo real |
| Lucide React | latest | Íconos |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Flask | 3.0.3 | Framework de API |
| Celery | 5.4 | Cola de tareas |
| SQLAlchemy | latest | ORM |
| PostgreSQL | 16 | Base de datos principal |
| Redis | 7 | Broker + caché |
| Polars | latest | DataFrames de alto rendimiento |
| PyArrow | latest | Almacenamiento Parquet |
| Playwright | latest | Automatización de navegador |
| Selenium | latest | Automatización de navegador |
| CloudScraper | latest | Bypass de Cloudflare |
| BeautifulSoup4 | latest | Parsing HTML |
| DuckDB | latest | SQL en proceso |
| XGBoost | latest | Modelos ML |
| TensorFlow | 2.17 | Deep learning |
| Prophet | 1.1.5 | Series de tiempo |

## Estructura del proyecto

```
DataHarvest/
├── frontend/                  # React + TanStack Start
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # AppShell, Sidebar, TopBar
│   │   │   ├── onboarding/    # TourManager, TourSpotlight, TourTooltip
│   │   │   └── ui/            # Componentes UI compartidos
│   │   ├── hooks/             # useApi, hooks de React Query
│   │   ├── lib/               # Instancia Axios, Socket.IO
│   │   ├── pages/             # Dashboard, Scraper, Analytics, etc.
│   │   ├── routes/            # Rutas de TanStack Router
│   │   └── stores/            # Stores de Zustand
│   ├── public/
│   │   └── dataharvest_logo.svg
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                   # Flask + Celery
│   ├── app/
│   │   ├── api/               # Blueprints REST
│   │   │   ├── scraper.py
│   │   │   ├── tables.py
│   │   │   ├── analytics.py
│   │   │   └── ...
│   │   ├── core/              # Modelos DB, config Celery
│   │   │   ├── database.py
│   │   │   ├── celery_app.py
│   │   │   └── socket_events.py
│   │   ├── scrapers/
│   │   │   └── engines/
│   │   │       └── scraper_engine.py  # Playwright, Selenium, Requests, CloudScraper
│   │   ├── tasks/             # Tareas Celery
│   │   │   ├── scraper_tasks.py
│   │   │   ├── analytics_tasks.py
│   │   │   ├── ai_tasks.py
│   │   │   └── ...
│   │   └── utils/             # Extensiones Cython (.pyx)
│   ├── data/
│   │   ├── scraped/           # Resultados en Parquet
│   │   └── uploads/           # Datasets subidos
│   ├── Dockerfile
│   ├── requirements.txt
│   └── run.py
│
├── docker-compose.yml
├── README.md
└── README.es.md
```

## Inicio rápido

### Requisitos previos
- Python 3.11+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (via WSL en Windows)
- Docker (opcional)

### Configuración para desarrollo

**1. Clona el repositorio:**
```bash
git clone https://github.com/Brashkie/DataHarvest.git
cd DataHarvest
```

**2. Configurar backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
playwright install chromium
```

**3. Configurar variables de entorno:**
```bash
cp backend/.env.example backend/.env
# Edita DATABASE_URL, REDIS_URL, etc.
```

**4. Configurar frontend:**
```bash
cd frontend
npm install
```

**5. Iniciar Redis (WSL en Windows):**
```bash
sudo service redis-server start
```

**6. Levantar todos los servicios (3 terminales):**

```bash
# Terminal 1 — Backend Flask
cd backend && venv\Scripts\activate && py run.py

# Terminal 2 — Celery Worker
cd backend && venv\Scripts\activate
celery -A run.celery worker -Q scraping,pipelines,analytics,ai,exports -c 1 --loglevel=info --pool=solo

# Terminal 3 — Frontend
cd frontend && npm run dev
```

**7. Abre:** http://localhost:3000

### Con Docker

```bash
docker-compose up --build
```

Abre: http://localhost:80

## Modelos de base de datos

| Tabla | Descripción |
|-------|-------------|
| `scraper_jobs` | Jobs de scraping con estado, config y resultados |
| `scraper_profiles` | Configuraciones reutilizables de scraper |
| `pipelines` | Definiciones de pipelines ETL (ReactFlow) |
| `pipeline_runs` | Historial de ejecuciones de pipelines |
| `datasets` | Metadata de datasets (archivos Parquet) |
| `ml_models` | Registro de modelos entrenados |
| `job_logs` | Logs en tiempo real por job |
| `export_jobs` | Registro de tareas de exportación |

## Motores de scraping

| Motor | Recomendado para |
|-------|-----------------|
| `auto` | Selección automática según análisis de URL |
| `playwright` | Sitios con JS pesado, SPAs, apps React/Vue |
| `selenium` | Interacciones complejas, llenado de formularios |
| `requests` | Páginas HTML estáticas (más rápido) |
| `cloudscraper` | Sitios protegidos con Cloudflare |

## Endpoints de la API

```
GET    /api/v1/health/
GET    /api/v1/scraper/jobs
POST   /api/v1/scraper/jobs
GET    /api/v1/scraper/jobs/:id
DELETE /api/v1/scraper/jobs/:id
GET    /api/v1/scraper/jobs/:id/results
POST   /api/v1/scraper/test-url
GET    /api/v1/tables/datasets
POST   /api/v1/tables/datasets/upload
GET    /api/v1/tables/datasets/:id
GET    /api/v1/tables/datasets/:id/export/:fmt
GET    /api/v1/analytics/...
GET    /api/v1/monitor/...
```

Documentación completa: http://localhost:5000/api/docs/

## Variables de entorno

```env
# Aplicación
APP_ENV=development
APP_SECRET_KEY=tu-clave-secreta
APP_PORT=5000

# Base de datos
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/dataharvest
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Scraping
PLAYWRIGHT_HEADLESS=true
REQUEST_TIMEOUT=30
MAX_CONCURRENT_SCRAPERS=10

# AI/ML (opcional)
OPENAI_API_KEY=
HUGGINGFACE_TOKEN=
MLFLOW_TRACKING_URI=http://localhost:5001
```

## Licencia

MIT — Desarrollado por [Brashkie / Hepein Oficial](https://github.com/Brashkie)