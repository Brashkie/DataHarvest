# DataHarvest
## Professional Data Platform v2.0

> Plataforma profesional de extracción web, pipelines ETL, analítica de datos e IA

**Stack:** `React 19` · `Flask 3` · `Celery 5` · `Tailwind v4` · `TanStack`

---

## Índice

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Proyecto](#2-arquitectura-del-proyecto)
3. [Stack Tecnológico](#3-stack-tecnológico-completo)
4. [Backend — Python / Flask](#4-backend--python--flask)
5. [Motores de Scraping](#5-motores-de-scraping)
6. [Tareas en Background (Celery)](#6-tareas-en-background-celery)
7. [API REST — Endpoints](#7-api-rest--endpoints)
8. [Frontend — React 19](#8-frontend--react-19)
9. [Módulos de la Aplicación](#9-módulos-de-la-aplicación)
10. [Base de Datos y Almacenamiento](#10-base-de-datos-y-almacenamiento)
11. [Instalación y Arranque](#11-instalación-y-arranque)
12. [Variables de Entorno](#12-variables-de-entorno)
13. [Docker — Despliegue Completo](#13-docker--despliegue-completo)
14. [Seguridad](#14-seguridad)
15. [Licencia y Créditos](#15-licencia-y-créditos)

---

## 1. Descripción General

DataHarvest es una plataforma empresarial todo-en-uno diseñada para automatizar la extracción de datos de sitios web (scraping), procesarlos a través de pipelines ETL, analizarlos con herramientas de inteligencia artificial y exportarlos en múltiples formatos. Funciona tanto en entornos públicos como privados.

### ¿Qué problema resuelve?

En muchos proyectos de data engineering se necesita recolectar datos de múltiples fuentes web, limpiarlos, transformarlos y convertirlos en información accionable. DataHarvest reemplaza la necesidad de escribir scripts individuales para cada tarea — todo desde una sola interfaz visual.

### Casos de uso principales

- Monitoreo de precios en e-commerce (comparación competitiva)
- Recolección de datos de noticias, redes sociales o portales públicos
- Extracción de tablas y formularios de sistemas internos con acceso autenticado
- Construcción de datasets para entrenamiento de modelos ML
- Análisis exploratorio automatizado (EDA) con reportes PDF generados automáticamente
- Forecasting de series temporales con Prophet
- ETL hacia BigQuery, S3, PostgreSQL o MongoDB

---

## 2. Arquitectura del Proyecto

El proyecto sigue una arquitectura cliente-servidor con comunicación REST y WebSocket en tiempo real. El backend está completamente desacoplado del frontend.

| Capa | Tecnología |
|---|---|
| Interfaz de usuario | React 19 + Vite 6 + TanStack Router/Query + Tailwind v4 |
| API REST | Flask 3 + Flask-CORS + Flask-SocketIO + Flasgger (Swagger) |
| Tareas en background | Celery 5 + Redis (broker) + Flower (monitor) |
| Scraping | Playwright + Selenium + Requests + CloudScraper + BeautifulSoup |
| Procesamiento datos | Pandas + Polars + NumPy + PyArrow + DuckDB |
| IA / ML | TensorFlow + XGBoost + scikit-learn + Prophet + MLflow |
| Base de datos | PostgreSQL + MongoDB + Redis + SQLAlchemy |
| Cloud / Big Data | BigQuery + S3 + PySpark + Google Cloud Storage |
| Exportación | ReportLab (PDF) + openpyxl (XLSX) + python-docx |

---

## 3. Stack Tecnológico Completo

### 3.1 Backend — Python

#### Web Framework

| Paquete | Descripción |
|---|---|
| `flask==3.0.3` | Micro-framework HTTP — sirve la API REST |
| `flask-socketio==5.3.6` | WebSocket — emite progreso en tiempo real al browser |
| `flask-cors==4.0.0` | Permite peticiones cross-origin desde el frontend |
| `flasgger==0.9.7` | Genera Swagger UI automático en /api/docs/ |
| `flask-caching==2.3.0` | Cache Redis para respuestas frecuentes |
| `flask-limiter==3.7.0` | Rate limiting por IP para proteger la API |

#### Web Scraping

| Paquete | Descripción |
|---|---|
| `playwright==1.45.1` | Navegador real Chromium — ideal para SPAs y sitios con JS |
| `selenium==4.23.1` | WebDriver — automatización de formularios complejos |
| `requests==2.32.3` | HTTP cliente rápido — ideal para HTML estático |
| `cloudscraper==1.2.71` | Bypass de Cloudflare y protecciones anti-bot |
| `httpx==0.27.0` | HTTP asíncrono de alta performance |
| `beautifulsoup4==4.12.3` | Parser HTML/XML — extrae datos estructurados del DOM |
| `scrapy==2.11.2` | Framework de scraping para sitios a gran escala |
| `fake-useragent==1.5.1` | Rota User-Agents para evitar detección |

#### Data Engineering

| Paquete | Descripción |
|---|---|
| `pandas==2.2.2` | DataFrames — limpieza, transformación y análisis de datos |
| `polars==1.3.0` | DataFrames ultra-rápidos en Rust — 10-100x más veloz |
| `numpy==1.26.4` | Álgebra lineal y operaciones numéricas vectorizadas |
| `pyarrow==17.0.0` | Formato columnar Apache Arrow — lectura/escritura Parquet |
| `dask==2024.8.0` | DataFrames distribuidos para datasets que no caben en RAM |
| `pyspark==3.5.2` | Apache Spark desde Python para big data a escala |
| `google-cloud-bigquery` | Conexión directa a BigQuery para consultas SQL en la nube |

#### IA / Machine Learning

| Paquete | Descripción |
|---|---|
| `tensorflow==2.17.0` | Framework de deep learning de Google |
| `scikit-learn==1.5.1` | Algoritmos clásicos ML: Random Forest, SVM, k-means… |
| `xgboost==2.1.1` | Gradient boosting de alto rendimiento |
| `prophet==1.1.5` | Forecasting de series temporales (Facebook/Meta) |
| `optuna==3.6.1` | Optimización automática de hiperparámetros |
| `mlflow==2.15.1` | Tracking de experimentos y registro de modelos ML |
| `transformers==4.44.0` | Modelos de HuggingFace: BERT, GPT, clasificación NLP |
| `spacy==3.7.6` | Procesamiento de lenguaje natural — NER, POS tagging |

#### Background Tasks

| Paquete | Descripción |
|---|---|
| `celery==5.4.0` | Worker de tareas asíncronas — ejecuta scraping en background |
| `redis==5.0.7` | Message broker para Celery + caché de la aplicación |
| `flower==2.0.1` | Dashboard web para monitorear workers y tareas Celery |
| `apscheduler==3.10.4` | Programación de tareas periódicas (cron jobs) |
| `kombu==5.3.4` | Abstracción de mensajería para Celery |

---

### 3.2 Frontend — JavaScript / TypeScript

#### Core

| Paquete | Descripción |
|---|---|
| React 19 | Biblioteca UI con soporte Server Components y React Compiler |
| Vite 6 | Build tool ultra-rápido con HMR instantáneo |
| TypeScript 5.7 | Tipado estático estricto en todo el proyecto |
| TanStack Router | Router file-based con code splitting automático por ruta |
| TanStack Query v5 | Server state: cache, auto-refresh, optimistic updates |
| TanStack Table v8 | Tablas headless con sort, filter y virtualización |
| Zustand 5 + Immer | Estado global: tema, módulo activo, jobs en ejecución |

#### UI / Estilos

| Paquete | Descripción |
|---|---|
| Tailwind CSS v4 | `@import "tailwindcss"` — tokens en @theme, sin purge issues |
| Lucide React | Librería de iconos SVG consistentes y optimizados |
| clsx + tailwind-merge | Composición condicional de clases CSS sin conflictos |
| react-hot-toast | Notificaciones toast minimalistas y accesibles |
| Recharts | Charts declarativos: área, barra, scatter, radar, pie |
| ReactFlow | Editor visual de pipelines con nodos y conexiones drag&drop |

#### Comunicación

| Paquete | Descripción |
|---|---|
| Axios | Cliente HTTP tipado con interceptores para JWT y errores |
| Socket.IO Client | Conexión WebSocket para recibir progreso de jobs en vivo |
| react-dropzone | Drag & drop de archivos para upload de datasets |

---

## 4. Backend — Python / Flask

El backend sigue el patrón Application Factory con Flask Blueprints. Cada módulo funcional vive en su propio Blueprint con prefijo de URL independiente.

### Estructura de directorios

```
backend/
  app/
    __init__.py         # create_app() — App Factory
    core/
      config.py         # Pydantic Settings (dev/prod/test)
      database.py       # SQLAlchemy models: Job, Pipeline, Dataset, MLModel
      celery_app.py     # Celery config + queues + beat schedule
      socket_events.py  # SocketIO events (connect, job:subscribe)
    api/                # Flask Blueprints (REST endpoints)
    scrapers/engines/   # Playwright, Selenium, Requests, CloudScraper
    analytics/engines/  # Pandas profiler, Plotly, PatternDetector
    tasks/              # Celery tasks por módulo
    schemas/            # Pydantic v2 validators
    middleware/         # JWT auth, error handlers, rate limiting
  run.py                # Entry point Flask
  worker.py             # Entry point Celery
  requirements.txt      # +60 dependencias Python
```

---

## 5. Motores de Scraping

El sistema auto-selecciona el motor óptimo según el sitio objetivo. También se puede elegir manualmente.

| Motor | Cuándo usarlo | Tecnología | Capacidades |
|---|---|---|---|
| Playwright | SPAs, React/Vue, JS pesado | Chromium real | Screenshots, scroll, JS, formularios, autenticación |
| Selenium | Interacciones complejas | ChromeDriver | Click, drag, upload files, iframes, cookies |
| Requests | HTML estático, APIs | HTTP puro | Máxima velocidad, bajo consumo, paginación |
| CloudScraper | Sitios con Cloudflare | Impersonate browser | Bypass WAF, TLS fingerprint, JS challenge |
| Auto | Detección automática | Combinado | Analiza el sitio y elige el motor adecuado |

### Características avanzadas del scraper

- Modo stealth — elimina señales de automatización del navegador
- Soporte Tor — proxy SOCKS5 para anonimizar peticiones
- Paginación automática — sigue botones "Siguiente" hasta N páginas
- Auto-scroll — carga contenido lazy con scroll progresivo
- Selectores CSS y XPath — extracción estructurada campo a campo
- Extracción de tablas HTML — convierte automáticamente con Pandas `read_html`
- Reintentos con backoff exponencial — via librería `tenacity`
- Rotación de User-Agents — via `fake-useragent`

---

## 6. Tareas en Background (Celery)

Celery es el motor de ejecución asíncrona. Cuando el usuario inicia un job de scraping, Flask no espera a que termine — encola la tarea en Redis y responde inmediatamente. Un worker de Celery la ejecuta en segundo plano.

### Colas de trabajo

- `scraping` — jobs de extracción web (Playwright, Selenium, Requests)
- `pipelines` — ejecución de nodos ETL encadenados
- `analytics` — perfiles EDA, correlaciones, detección de patrones
- `ai` — entrenamiento de modelos ML, forecasting, clustering
- `exports` — generación de CSV, XLSX, PDF, Parquet
- `monitoring` — métricas del sistema cada 30 segundos
- `maintenance` — rotación de logs, limpieza de jobs obsoletos

### Celery Beat — tareas programadas

Un proceso separado (beat) ejecuta tareas periódicas definidas con cron expressions. Por ejemplo: recolectar métricas del sistema cada 30 segundos, limpiar jobs obsoletos cada 5 minutos, rotar logs cada 24 horas.

### Flower — monitor de Celery

Flower es una interfaz web que permite ver en tiempo real los workers activos, las tareas en cola, las completadas y las fallidas. Disponible en `http://localhost:5555`.

---

## 7. API REST — Endpoints

Todos los endpoints siguen el prefijo `/api/v1/`. La documentación interactiva Swagger está disponible en `/api/docs/` cuando el servidor está corriendo.

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/health/` | Estado del servidor y métricas del sistema |
| `POST` | `/api/v1/auth/login` | Login con usuario/contraseña → JWT token |
| `GET` | `/api/v1/auth/me` | Perfil del usuario autenticado |
| `GET` | `/api/v1/scraper/jobs` | Listar todos los jobs de scraping |
| `POST` | `/api/v1/scraper/jobs` | Crear y encolar un nuevo job |
| `GET` | `/api/v1/scraper/jobs/:id` | Detalle de un job específico |
| `DELETE` | `/api/v1/scraper/jobs/:id` | Cancelar un job en ejecución |
| `GET` | `/api/v1/scraper/jobs/:id/results` | Resultados extraídos (paginado) |
| `GET` | `/api/v1/scraper/jobs/:id/logs` | Logs en tiempo real del job |
| `POST` | `/api/v1/scraper/test-url` | Test rápido de URL (sin crear job) |
| `GET` | `/api/v1/tables/datasets` | Listar datasets disponibles |
| `POST` | `/api/v1/tables/datasets/upload` | Subir CSV / XLSX / JSON / Parquet |
| `POST` | `/api/v1/analytics/profile` | Perfil EDA automático del dataset |
| `POST` | `/api/v1/analytics/sql` | Consulta SQL sobre datos con DuckDB |
| `POST` | `/api/v1/analytics/patterns` | Detectar patrones, trends, anomalías |
| `GET` | `/api/v1/pipelines/` | Listar pipelines ETL |
| `POST` | `/api/v1/pipelines/` | Crear nuevo pipeline |
| `POST` | `/api/v1/pipelines/:id/run` | Ejecutar pipeline via Celery |
| `GET` | `/api/v1/ai/models` | Listar modelos ML entrenados |
| `POST` | `/api/v1/ai/train` | Entrenar nuevo modelo (background) |
| `POST` | `/api/v1/ai/predict` | Predicciones con modelo desplegado |
| `POST` | `/api/v1/ai/forecast` | Forecast temporal con Prophet |
| `POST` | `/api/v1/exports/` | Exportar datos (CSV/XLSX/JSON/PDF) |
| `GET` | `/api/v1/monitor/system` | CPU, RAM, disco, red en tiempo real |
| `GET` | `/api/v1/monitor/celery` | Estado de workers y tareas Celery |

---

## 8. Frontend — React 19

El frontend es una Single Page Application (SPA) construida con React 19 y Vite 6. No hay Server-Side Rendering — toda la lógica de UI corre en el navegador.

### Patrón de arquitectura

- **TanStack Router** — cada página es una ruta file-based con lazy loading automático
- **TanStack Query** — gestiona todo el estado del servidor: caching, re-fetch, invalidaciones
- **Zustand 5** — estado del cliente: tema activo, módulo seleccionado, jobs en ejecución
- **Custom hooks (`useApi.ts`)** — abstraen todas las llamadas al backend con tipos explícitos
- **CSS custom properties** — tema oscuro/claro sin parpadeo con variables en `:root` y `.dark`

### Estructura de archivos

```
frontend/src/
  routes/
    __root.tsx          # Layout raíz: QueryClientProvider + Toaster
    index.tsx           # Ruta / → AppShell
    about.tsx           # Ruta /about → información del proyecto
  components/
    layout/
      AppShell.tsx      # Shell: Sidebar + TopBar + página activa
      Sidebar.tsx       # Navegación + estado de conexión + toggle tema
      TopBar.tsx        # Búsqueda global + acciones + jobs activos
    ui/index.tsx        # Componentes: Badge, Modal, Panel, Tabs, etc.
  pages/               # Una página por módulo (lazy loaded)
  hooks/useApi.ts      # 35+ React Query hooks tipados
  lib/api.ts           # Axios client + Socket.IO + métodos REST
  stores/appStore.ts   # Zustand: tema, módulo, jobs, notificaciones
  styles/globals.css   # @import tailwindcss + CSS custom properties
  router.tsx           # createRouter() para TanStack Start
  main.tsx             # Entry point: RouterProvider
  routeTree.gen.ts     # Auto-generado por TanStack Router
```

---

## 9. Módulos de la Aplicación

### Dashboard

Pantalla principal con KPIs en tiempo real: total de filas recolectadas, jobs activos, tasa de éxito y duración promedio. Incluye gráfico de área (rows/24h), gráfico de estado de pipelines (pie chart) y tabla de jobs recientes. La gráfica de CPU/RAM se actualiza cada 3 segundos consultando `/api/v1/monitor/system`.

### Web Scraper

Módulo central de extracción. Incluye un URL Tester que analiza el sitio en tiempo real y sugiere el motor óptimo (detecta Cloudflare, JavaScript pesado, tiempo de respuesta). El creador de jobs permite configurar selectores CSS, opciones de scroll automático, screenshot, modo stealth, y proxy Tor. Los resultados del scraping se visualizan en una tabla virtualizada con exportación directa a CSV.

### Pipelines ETL

Editor visual construido con ReactFlow donde el usuario arrastra y conecta nodos: Scraper → Transform → Filter → AI → Export. Cada nodo representa una operación sobre los datos. Los pipelines se ejecutan vía Celery y soportan programación con cron expressions.

### Analytics

Generador de gráficos interactivo con soporte para Area, Bar, Scatter y Radar charts usando Recharts. Incluye auto-profiler EDA que genera estadísticas por columna (media, desviación, skewness, outliers), detección de patrones (columnas email, URL, ID, fecha), matriz de correlaciones y consultas SQL ad-hoc con DuckDB ejecutado en memoria.

### Data Tables

Tabla de datos virtualizada con ordenamiento, filtrado y paginación. Soporta subida de archivos (CSV, JSON, XLSX, Parquet) por drag & drop. Incluye un panel de esquema con tipos de datos, y un modo SQL donde el usuario escribe consultas DuckDB sobre el dataset cargado.

### AI / ML Studio

Interfaz para entrenar modelos de clasificación y regresión (Random Forest, Gradient Boosting, XGBoost, Logistic Regression), hacer forecasting de series temporales con Prophet, y aplicar K-Means clustering. Los modelos entrenados se registran en MLflow y se pueden exportar para predicciones futuras.

### Reports / Exports

Módulo de exportación multiformat: CSV (universal), XLSX con formato (via openpyxl), JSON array, Parquet columnar y PDF con tablas y estadísticas generado con ReportLab. Los archivos se sirven desde `/api/v1/exports/:id/download`.

### Monitor

Panel de observabilidad con métricas del sistema en tiempo real (CPU por núcleo, memoria total/usada, disco, red), estado de los workers Celery (activos, en cola), y un stream de logs de la aplicación que se actualiza cada 5 segundos.

---

## 10. Base de Datos y Almacenamiento

### PostgreSQL — almacenamiento principal

- Modelos: `ScraperJob`, `ScraperProfile`, `Pipeline`, `PipelineRun`, `Dataset`, `MLModel`, `ExportJob`, `JobLog`
- ORM: SQLAlchemy 2.0 con conexión pooling (`pool_size=10`, `max_overflow=20`)
- Migraciones: Alembic

### Redis — broker y caché

- Base de datos 0: caché de la aplicación (Flask-Caching)
- Base de datos 1: broker de mensajes para Celery
- Base de datos 2: backend de resultados Celery (resultados de tareas)

### MongoDB — almacenamiento flexible

- Resultados de scraping con estructura variable (documentos JSON)
- Perfiles de scraper y configuraciones personalizadas

### Almacenamiento de archivos

- `./data/scraped/` — resultados en formato Parquet (columnar, comprimido)
- `./data/models/` — artefactos de modelos ML serializados con joblib
- `./exports/` — archivos generados para descarga (CSV, XLSX, PDF)
- AWS S3 / Google Cloud Storage — para despliegue en producción

---

## 11. Instalación y Arranque

### Requisitos previos

- Python 3.11 o superior
- Node.js 18 o superior + npm o pnpm
- Redis 7+ (en localhost:6379)
- PostgreSQL 14+ (opcional en desarrollo — por defecto usa SQLite)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate         # Linux/Mac
venv\Scripts\activate            # Windows
pip install -r requirements.txt
playwright install chromium       # Instala navegador para scraping JS
cp .env.example .env              # Configurar variables de entorno
```

Luego arrancar los 4 procesos (cada uno en su propia terminal):

```bash
python run.py                     # Terminal 1 — Flask API → :5000

celery -A worker.celery worker \  # Terminal 2 — Workers
  --queues=scraping,pipelines,analytics,ai,exports,monitoring \
  --concurrency=4

celery -A worker.celery beat      # Terminal 3 — Tareas programadas
celery -A worker.celery flower    # Terminal 4 — Monitor → :5555
```

### Frontend

```bash
cd frontend
npm install
npm run dev                       # Vite dev server → :3000
```

### Con Docker (todo en uno)

```bash
docker compose up -d
```

Esto levanta: PostgreSQL, Redis, MongoDB, Flask API, Celery Worker, Celery Beat, Flower y el Frontend.

---

## 12. Variables de Entorno

Copiar `backend/.env.example` a `backend/.env` y completar los valores necesarios.

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./dh.db` | URL de conexión a PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis para caché y Celery |
| `CELERY_BROKER_URL` | `redis://localhost:6379/1` | Broker de mensajes Celery |
| `APP_SECRET_KEY` | *(cambiar en prod)* | Clave para firmar sesiones Flask |
| `JWT_SECRET_KEY` | *(cambiar en prod)* | Clave para firmar tokens JWT |
| `PLAYWRIGHT_HEADLESS` | `true` | Ejecutar Chromium sin ventana |
| `MAX_CONCURRENT_SCRAPERS` | `10` | Límite de scrapers paralelos |
| `OPENAI_API_KEY` | *(opcional)* | Para features de IA generativa |
| `GCP_PROJECT_ID` | *(opcional)* | Para BigQuery y Google Cloud |
| `AWS_ACCESS_KEY_ID` | *(opcional)* | Para S3 y AWS Glue |

---

## 13. Docker — Despliegue Completo

El archivo `docker-compose.yml` levanta toda la infraestructura necesaria con un solo comando.

| Servicio | Puerto | Descripción |
|---|---|---|
| `api` | `:5000` | Flask API + SocketIO + Swagger |
| `worker` | — | Celery worker con 4 concurrencias |
| `beat` | — | Celery beat para tareas programadas |
| `flower` | `:5555` | Monitor de Celery con UI web |
| `frontend` | `:3000` | Vite dev server / React build |
| `postgres` | `:5432` | PostgreSQL 16 con volumen persistente |
| `redis` | `:6379` | Redis 7 — broker + caché |
| `mongo` | `:27017` | MongoDB 7 para documentos flexibles |
| `mlflow` | `:5001` | Tracking de experimentos ML |

---

## 14. Seguridad

### Autenticación

- JWT (JSON Web Tokens) — firmados con HS256, expiran en 1 hora
- Refresh tokens con expiración de 7 días
- Contraseñas hasheadas con bcrypt via passlib

### Protección de la API

- Rate limiting — 100 req/hora por IP por defecto (configurable)
- CORS configurado para orígenes específicos en producción
- Validación de input con Pydantic v2 en todos los endpoints
- Sanitización de expresiones SQL para prevenir inyección

### Scraping responsable

- Delay configurable entre peticiones para no sobrecargar servidores
- Respeto de robots.txt (configurable por job)
- Rotación de User-Agents para reducir huella digital
- Soporte de proxy para anonimización (incluyendo Tor)

---

## 15. Licencia y Créditos

**DataHarvest v2.0 — Plataforma de Scraping y Analítica de Datos**

Construido con Python 3.11, Flask 3, Celery 5, React 19, Vite 6, TanStack Router y Tailwind CSS v4.

Librerías de terceros: Playwright, Selenium, Pandas, Polars, TensorFlow, XGBoost, Prophet, Recharts, ReactFlow, Socket.IO y muchas más. Ver `requirements.txt` y `package.json` para la lista completa.

---

*DataHarvest — Professional Data Platform v2.0*

## 📄 License
MIT — DataHarvest v2.0