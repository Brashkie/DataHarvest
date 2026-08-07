# DataHarvest Pro v3.0

<div align="center">

![DataHarvest Logo](public/dataharvest_logo.svg)

**Plataforma profesional de scraping y analisis de datos — alto rendimiento, multi-motor, lista para produccion**

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-black?logo=flask)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis)](https://redis.io)
[![Celery](https://img.shields.io/badge/Celery-5.5-37814a?logo=celery)](https://docs.celeryq.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Caracteristicas](#caracteristicas) · [Stack](#stack) · [Inicio rapido](#inicio-rapido) · [Arquitectura](#arquitectura) · [Rendimiento](#rendimiento) · [API](#referencia-de-api) · [Contribuir](#contribuir)

</div>

---

## Descripcion

DataHarvest es una plataforma full-stack para **extraer, procesar, analizar y exportar** datos de cualquier sitio web a escala. Combina un frontend en React 19 con actualizaciones en tiempo real via WebSocket, un backend Flask + Celery para procesamiento distribuido en segundo plano, y extensiones nativas de alto rendimiento escritas en **Cython, C/C++, Rust y Zig** para las operaciones mas exigentes.

La plataforma esta disenada para manejar desde scrapes puntuales hasta pipelines ETL continuos, entrenamiento de modelos ML y exportacion de datos a escala de terabytes, todo desde una interfaz unificada.

---

## Caracteristicas

| Categoria | Capacidades |
|-----------|-------------|
| **Scraping** | Playwright, Selenium, Requests, CloudScraper, Scrapy con seleccion automatica por motor |
| **Tiempo real** | Actualizaciones de progreso via WebSocket (Socket.IO) por cada paso del job |
| **URL Tester** | Pre-verificacion de URL: detecta Cloudflare, JS, errores TLS antes de crear el job |
| **Almacenamiento** | Parquet (Snappy) + PostgreSQL + Redis + MongoDB + ClickHouse + S3 |
| **Analytics** | Perfiles EDA (YData), DuckDB SQL, Polars, Pandas, Dask, PySpark |
| **ML / AI** | XGBoost, LightGBM, TensorFlow, PyTorch, Prophet, Optuna HPO, seguimiento con MLflow |
| **Pipelines** | Editor ETL visual (ReactFlow), PySpark, encadenamiento de tareas Celery |
| **Onboarding** | Sistema de tour con spotlight, guias interactivas por modulo |
| **Exportacion** | CSV, Excel, JSON, Parquet, BigQuery, S3, Azure Blob |
| **Despliegue** | Docker Compose con 11 servicios, Nginx, monitoreo con Flower |
| **Rendimiento** | Rutas criticas en Cython, parsers en C, capas de aceleracion en Rust/Zig opcionales |
| **Herramientas Dev** | CLI de consola multiplataforma (`scripts/cli.js`) — funciona en Windows sin `make`/`tmux` — mas generacion automatica de tipos TypeScript desde Pydantic |

---

## Arquitectura

```
+------------------------------------------------------------------+
|                       Navegador / Cliente                         |
|   React 19 · TanStack Router · TanStack Query · Zustand          |
|   Recharts · Plotly · ReactFlow · Socket.IO Client               |
+-------------------------+----------------------------------------+
                          | HTTP + WebSocket
+-------------------------v----------------------------------------+
|                    Flask API  (puerto 5050)                       |
|   Blueprints: scraper · tables · analytics · ai · pipelines      |
|   Flask-SocketIO · Flask-Caching · Flask-Limiter · Flasgger      |
+-----------+--------------------------------------+----------------+
            | Tareas Celery                        | SQLAlchemy
+-----------v-----------+          +--------------v---------------+
|    Workers Celery     |          |       PostgreSQL 16           |
|  +----------------+  |          |  scraper_jobs                 |
|  |  cola scraping |<->|  Redis 7 |  pipelines                   |
|  |  cola analytics|  |  (broker +|  datasets                    |
|  |  cola ai       |  |  results) |  ml_models                   |
|  |  cola pipelines|  |           |  job_logs                    |
|  +-------+--------+  |          +------------------------------+
+----------+------------+
           | HTTP + x-api-key (fail-open)          Redis DB 3
+----------v-----------------------------------------------------------+
|        ratelimiter — sidecar Rust / Axum  (puerto 8090)             |
|   Rate-limiting de scraping + dedup de URLs, compartido entre todos |
|   los procesos worker de Celery. /rate/check · /dedup/check · /health|
+----------+-----------------------------------------------------------+
           |
+----------v-----------------------------------------------------------+
|               Capa de Rendimiento Nativo                             |
|  Cython (.pyx)     Extensiones C/C++     Bindings Rust (opcional)   |
|  scraper_core      parser_core           zig_parser (opcional)       |
|  analytics_core    html_parser.c         rust_extractor              |
+----------------------------------------------------------------------+
```

---

## Stack

### Frontend
| Tecnologia | Version | Uso |
|------------|---------|-----|
| React | 19 | Framework UI |
| TanStack Start | 1.x | SSR / meta-framework |
| TanStack Router | latest | Enrutamiento basado en archivos |
| TanStack Query | latest | Estado del servidor + cache |
| Tailwind CSS | v4 | Estilos utility-first |
| Zustand | 5 | Estado cliente (Immer + persist) |
| Recharts | latest | Graficas del dashboard |
| Plotly | latest | Visualizaciones avanzadas |
| Socket.IO Client | latest | WebSocket en tiempo real |
| ReactFlow | latest | Editor visual de pipelines |
| Lucide React | latest | Sistema de iconos |
| Zod | latest | Validacion de esquemas |
| Vite | 7 | Herramienta de build |

### Backend — Python
| Tecnologia | Version | Uso |
|------------|---------|-----|
| Flask | 3.0.3 | API REST |
| Celery | 5.5 | Cola de tareas distribuida |
| SQLAlchemy | 2.0 | ORM + migraciones (Alembic) |
| Polars | 1.3 | DataFrames de alto rendimiento |
| Pandas | 2.2 | Procesamiento de DataFrames |
| DuckDB | latest | SQL analitico en proceso |
| PyArrow | latest | I/O Parquet |
| Dask | 2026 | Computacion distribuida |
| PySpark | 4.1 | Procesamiento de big data |
| Playwright | latest | Automatizacion browser (sitios JS) |
| Selenium | 4.23 | Automatizacion browser (formularios) |
| CloudScraper | 1.2.71 | Bypass de Cloudflare |
| Scrapy | 2.11 | Crawling a gran escala |
| XGBoost | latest | Gradient boosting |
| TensorFlow | 2.21 | Deep learning |
| PyTorch | latest | Investigacion / redes neuronales |
| Prophet | 1.3 | Prediccion de series de tiempo |
| MLflow | latest | Seguimiento de experimentos |
| Numba | latest | NumPy compilado con JIT |

### Backend — Infraestructura
| Servicio | Version | Uso |
|----------|---------|-----|
| PostgreSQL | 16 | Almacen relacional principal |
| Redis | 7 | Broker + backend de resultados + cache |
| MongoDB | 7 | Almacen de documentos (payloads raw) |
| ClickHouse | latest | Analytics columnar (opcional) |
| Elasticsearch | latest | Busqueda de texto completo (opcional) |
| MLflow | latest | UI de experimentos ML |
| Flower | latest | UI de monitoreo de Celery |
| Nginx | alpine | Proxy inverso + archivos estaticos |

### Backend — Servicios sidecar

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Rust + Axum | edicion 2021 | `ratelimiter/` — rate-limiting de scraping + dedup de URLs, compartido entre los procesos worker de Celery (puerto 8090). Habla HTTP/JSON, estado en Redis DB 3, fail-open. |

---

## Rendimiento

DataHarvest usa multiples estrategias de aceleracion nativa segun la carga de trabajo.

### Extensiones Cython

Rutas criticas compiladas a C para un speedup de 10 a 50 veces sobre Python puro:

```
app/scrapers/scraper_core.pyx    — parseo de URL, normalizacion de headers, chunking de respuesta
app/analytics/analytics_core.pyx — transformaciones de DataFrame, pipelines de agregacion
app/utils/parser_core.pyx         — tokenizador HTML, motor de selectores CSS
```

Compilar todas las extensiones:
```bash
python setup.py build_ext --inplace
```

### Extensiones C / C++

Modulos de bajo nivel llamables desde Python via `ctypes` o `cffi`:

```
native/html_parser.c    — Tokenizador HTML rapido (ANSI C, sin dependencias)
native/csv_writer.cpp   — Serializacion CSV vectorizada (C++17 + SIMD)
```

Compilar:
```bash
# Extension C
gcc -O3 -march=native -shared -fPIC -o html_parser.so native/html_parser.c

# Extension C++
g++ -O3 -std=c++17 -march=native -shared -fPIC -o csv_writer.so native/csv_writer.cpp
```

### Bindings Rust (opcional)

Para extraccion con expresiones regulares intensivas y filtrado paralelo de URLs, un crate Rust provee ~100x sobre el modulo `re` de Python:

```
rust_ext/          — Workspace de Cargo
  src/extractor.rs         — Extraccion regex paralela (rayon)
  src/url_filter.rs        — Deduplicacion de URLs con Bloom filter
  src/lib.rs               — Bindings PyO3
```

Compilar e instalar:
```bash
cd rust_ext
pip install maturin
maturin develop --release
```

Activar en la configuracion:
```env
USE_RUST_EXTRACTOR=true
```

### Parser Zig (opcional)

Parser JSON/HTML de streaming de latencia ultra-baja para payloads masivos:

```
zig_parser/
  src/json_stream.zig      — Tokenizador JSON en streaming
  src/html_stream.zig      — Parser HTML5 en streaming
  build.zig                — Configuracion de build
```

Compilar:
```bash
cd zig_parser
zig build -Doptimize=ReleaseFast
# Resultado: zig-out/lib/libzig_parser.so
```

Cargar desde Python:
```python
import ctypes
_lib = ctypes.CDLL("zig_parser/zig-out/lib/libzig_parser.so")
```

### Hotspots en Assembly

Los bucles internos mas criticos (hashing, checksums, manipulacion de bits) tienen implementaciones en Assembly x86-64:

```
asm/
  url_hash.asm             — Hash FNV-1a de 64 bits (vectorizado AVX2)
  crc32c.asm               — CRC32C para verificacion de integridad
```

Ensamblar:
```bash
nasm -f elf64 -o url_hash.o asm/url_hash.asm
ld -shared -o url_hash.so url_hash.o
```

### Notas de rendimiento

- Todas las capas nativas son **opcionales** — siempre hay un fallback en Python puro.
- Se activan/desactivan por extension via `.env` (`USE_RUST_EXTRACTOR`, `USE_ZIG_PARSER`, `USE_ASM_HASH`).
- Las extensiones Cython se **compilan siempre** en el setup — solo requieren un compilador C.
- En Windows, compilar las extensiones Rust/Zig en WSL2 y copiar el `.so` resultante.

---

## Estructura del proyecto

Backend y frontend viven juntos en la raiz del repo -- un solo `package.json`,
un solo `.venv`, un solo `.env`, un solo `npm install` / `node scripts/cli.js install`.
Sin `cd backend` / `cd frontend` para nada.

```
DataHarvest/
+-- src/                          Frontend (React 19 + TanStack Start)
|   +-- components/
|   |   +-- layout/               AppShell, Sidebar, TopBar
|   |   +-- onboarding/           TourManager, TourSpotlight, TourTooltip, tours
|   |   +-- ui/                   Button, Badge, Panel, Spinner, CodeBlock
|   +-- hooks/                    useApi, useSystemMetrics, useWebSocket
|   +-- lib/
|   |   +-- api.ts             instancia axios, cliente socket.io, namespaces de API tipados
|   |   +-- types.generated.ts AUTO-GENERADO -- no editar a mano, ver `npm run gen:types`
|   +-- pages/                    Dashboard, Scraper, Analytics, DataTables,
|   |                             Pipelines, AIStudio, Reports, Monitor, Settings
|   +-- routes/                   rutas file-based de TanStack Router
|   +-- stores/                   appStore.ts (Zustand: tema, sidebar, jobs)
|   +-- styles.css                tokens de diseno, clases de componentes
+-- public/                       dataharvest_logo.svg, favicon
+-- content/                      fuentes markdown de content-collections
|
+-- app/                          Backend (Flask + Celery)
|   +-- api/                      scraper.py, tables.py, analytics.py, ai.py,
|   |                             pipelines.py, exports.py, health.py, monitor.py
|   +-- core/                     config.py, database.py, celery_app.py, socket_events.py
|   +-- scrapers/
|   |   +-- engines/              scraper_engine.py (Playwright/Selenium/Requests/CloudScraper)
|   |   +-- scraper_core.pyx      ruta critica compilada con Cython
|   +-- analytics/
|   |   +-- engines/              analytics_engine.py (DataProfiler, ChartGenerator)
|   |   +-- analytics_core.pyx
|   +-- tasks/                    scraper_tasks.py, pipeline_tasks.py, analytics_tasks.py,
|   |                             ai_tasks.py, export_tasks.py, monitor_tasks.py
|   +-- schemas/                  requests.py (modelos Pydantic v2 -- fuente de verdad para los tipos TS)
|   +-- middleware/               auth.py (JWT)
|   +-- core/
|   |   +-- ratelimiter_client.py cliente httpx del sidecar Rust (fail-open)
|   +-- utils/
|       +-- helpers.py
|       +-- parser_core.pyx       parser HTML con Cython
|
+-- ratelimiter/                  sidecar Rust / Axum — rate-limit de scraping + dedup de URLs
|   +-- Cargo.toml
|   +-- src/
|       +-- main.rs               bootstrap: env, conexion redis, router, serve
|       +-- config.rs state.rs auth.rs error.rs
|       +-- routes/               health.rs · rate.rs · dedup.rs
|
+-- native/                       fuentes de extensiones C/C++ (opcional)
+-- rust_ext/                     crate Rust + PyO3 (opcional)
+-- zig_parser/                   parser streaming en Zig (opcional)
+-- asm/                          hotspots x86-64 ASM (opcional)
+-- data/
|   +-- scraped/                  archivos Parquet de salida
|   +-- uploads/                  datasets subidos
+-- migrations/                   scripts de migracion Alembic
+-- tests/                        suite de tests pytest
+-- requirements.txt
+-- setup.py                      configuracion de build Cython
+-- run.py                        punto de entrada del backend
+-- worker.py                     punto de entrada del worker Celery
|
+-- scripts/
|   +-- cli.js                    CLI de consola unificada -- dev/backend/frontend/worker/beat/
|   |                             docker/test/lint/migrate/gen-types (multiplataforma, sin make/tmux)
|   +-- export_schema.py          vuelca los schemas Pydantic a JSON Schema (insumo de gen-types.mjs)
|   +-- gen-types.mjs             compilador JSON Schema (Pydantic) -> TypeScript
|
+-- .venv/                        virtualenv de Python (ignorado por git, lo crea `install`)
+-- node_modules/                 (ignorado por git, lo crea `npm install`)
|
+-- Dockerfile.backend  Dockerfile.frontend  Dockerfile.ratelimiter  nginx.conf
+-- docker-compose.yml
+-- Makefile                      atajos Unix (Linux/macOS) -- en Windows usa scripts/cli.js
+-- package.json                  `npm run cli -- <comando>`
+-- tsconfig.json  vite.config.ts  vitest.config.ts  biome.json  eslint.config.js
+-- .env  .env.example
+-- README.md
+-- README.es.md
```

---

## Inicio rapido

### Requisitos previos

| Requisito | Minimo | Notas |
|-----------|--------|-------|
| Python | 3.11+ | Se recomienda 3.12 |
| Node.js | 20+ | Version LTS |
| PostgreSQL | 16+ | o usar Docker |
| Redis | 7+ | WSL2 en Windows |
| Docker | 24+ | opcional, para el stack completo |
| Compilador C | gcc / clang | requerido para Cython |
| Rust / Cargo | 1.78+ | opcional — compila el sidecar `ratelimiter/`; `node scripts/cli.js dev` lo omite (fail-open) si cargo no esta instalado |
| Zig | 0.13+ | opcional, para zig_parser |
| ASM (nasm/gas) | 2.16+ | opcional, para modulos ASM |

---

### Opcion A — Docker (recomendado para el primer inicio)

La forma mas rapida de levantar todos los servicios:

```bash
# 1. Clonar
git clone https://github.com/Brashkie/DataHarvest.git
cd DataHarvest

# 2. Copiar plantilla de entorno
cp .env.example .env
# Editar .env: secretos, API keys, etc.

# 3. Compilar e iniciar los 11 servicios
docker-compose up --build

# 4. Abrir
#   Frontend: http://localhost
#   Docs API: http://localhost:5050/api/docs/
#   Flower:   http://localhost:5555
#   MLflow:   http://localhost:5001
```

Para levantar solo servicios especificos:
```bash
# Solo API + bases de datos (sin build del frontend)
docker-compose up api postgres redis mongo

# Frontend con hot-reload contra la API en ejecucion
npm run dev:frontend
```

---

### Opcion B — Desarrollo local (control total)

**Paso 1 — Clonar el repositorio**
```bash
git clone https://github.com/Brashkie/DataHarvest.git
cd DataHarvest
```

**Paso 2 — Entorno virtual de Python**
```bash
# Crear y activar venv
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate
```

**Paso 3 — Instalar dependencias del backend**
```bash
# Paquetes Python
pip install -r requirements.txt

# Navegadores de Playwright
playwright install chromium firefox

# Compilar extensiones Cython (requiere gcc/clang)
python setup.py build_ext --inplace
```

O saltate los pasos 2-3 por completo: `node scripts/cli.js install` crea el
venv e instala todo por vos.

**Paso 4 — Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env`:
```env
APP_ENV=development
APP_SECRET_KEY=cambiar-en-produccion
APP_PORT=5050

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/dataharvest

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Scraping
PLAYWRIGHT_HEADLESS=true
REQUEST_TIMEOUT=30
MAX_CONCURRENT_SCRAPERS=10

# Extensiones nativas (opcional)
USE_RUST_EXTRACTOR=false
USE_ZIG_PARSER=false
USE_ASM_HASH=false

# AI / ML (opcional)
OPENAI_API_KEY=
HUGGINGFACE_TOKEN=
MLFLOW_TRACKING_URI=http://localhost:5001
```

**Paso 5 — Inicializar base de datos**
```bash
# Levantar PostgreSQL y Redis primero (o via Docker)
docker-compose up postgres redis mongo -d

# Ejecutar migraciones
flask --app run db upgrade

# Cargar datos de demo (opcional)
python run.py seed
```

**Paso 6 — Dependencias del frontend**
```bash
npm install
```

**Paso 7 — Ejecutar todo**

Un solo comando levanta la API Flask, el dev server de Vite y un worker de
Celery juntos (salida etiquetada y coloreada — Ctrl+C detiene los tres):
```bash
npm run dev
# o: node scripts/cli.js dev
```

¿Preferis terminales separadas para mas control? Cada una detecta el venv
automaticamente, sin paso de activacion:
```bash
node scripts/cli.js backend   # Terminal 1 — Flask API
node scripts/cli.js worker    # Terminal 2 — Celery worker (todas las colas)
node scripts/cli.js beat      # Terminal 3 — Celery beat (tareas periodicas)
node scripts/cli.js frontend  # Terminal 4 — Vite dev server
```

**Paso 8 — Abrir la aplicacion**
```
Frontend:   http://localhost:3000
API:        http://localhost:5050
Docs API:   http://localhost:5050/api/docs/
Flower:     http://localhost:5555   (despues de: celery -A run.celery flower)
MLflow:     http://localhost:5001   (despues de: mlflow ui --port 5001)
```

---

### Opcion C — Atajos con Makefile (Linux / macOS)

```bash
make install      # Instalar deps backend + frontend + Cython
make dev          # Levantar stack completo de desarrollo
make backend      # Solo Flask API
make frontend     # Solo Vite dev server
make worker       # Celery worker (todas las colas)
make beat         # Celery beat
make ratelimiter  # Sidecar Rust de rate-limit/dedup (localhost:8090)
make flower       # Flower UI de monitoreo
make docker       # Stack completo via Docker Compose
make test         # pytest con reporte de cobertura
make lint         # black + ruff en app/
make type-check   # mypy en app/
make migrate      # flask db upgrade
make seed         # Cargar datos de demo
make build-ext    # Compilar extensiones Cython
make build-rust   # Compilar extension Rust (requiere Rust + maturin)
make build-zig    # Compilar parser Zig (requiere toolchain Zig)
```

---

### Opcion D — CLI de consola (`scripts/`, multiplataforma)

`make` y `tmux` no estan disponibles en Windows por defecto, asi que `scripts/cli.js`
es un script de Node sin dependencias que hace el mismo trabajo en Windows, Linux y
macOS. Detecta automaticamente el venv (`.venv/Scripts/python.exe` en Windows,
`.venv/bin/python` en el resto) y ejecuta los mismos comandos que usa el Makefile.

```bash
node scripts/cli.js <comando>       # o: npm run cli -- <comando>

node scripts/cli.js dev             # backend + frontend juntos, salida etiquetada/coloreada, Ctrl+C detiene ambos
node scripts/cli.js backend         # Solo Flask API (http://localhost:5050)
node scripts/cli.js frontend        # Solo Vite dev server (http://localhost:3000)
node scripts/cli.js worker          # Celery worker (todas las colas)
node scripts/cli.js beat            # Celery beat scheduler
node scripts/cli.js ratelimiter     # Sidecar Rust de rate-limit/dedup (http://localhost:8090, necesita cargo)
node scripts/cli.js flower          # Flower UI (http://localhost:5555)
node scripts/cli.js worker+beat     # worker + beat juntos
node scripts/cli.js docker          # docker compose up --build -d
node scripts/cli.js docker:down     # docker compose down
node scripts/cli.js test [backend|frontend]
node scripts/cli.js lint            # black + ruff en app/
node scripts/cli.js migrate         # flask db upgrade
node scripts/cli.js seed            # Cargar datos de demo
node scripts/cli.js build-ext       # Compilar extensiones Cython
node scripts/cli.js gen-types       # Regenerar src/lib/types.generated.ts
node scripts/cli.js install         # Instalar deps backend + frontend (crea ./.venv si falta)
node scripts/cli.js help            # Listar todos los comandos
```

Tambien hay atajos en el `package.json` raiz: `npm run dev`, `npm run backend`,
`npm run frontend`, `npm run worker`, `npm run beat`, `npm run gen-types`.

---

## Puente Python → TypeScript

Las formas de request/response se definen **una sola vez**, como modelos Pydantic en
[`app/schemas/requests.py`](app/schemas/requests.py) — el frontend
nunca escribe a mano una copia paralela de esos tipos, asi las dos capas no pueden
desincronizarse en silencio.

```
app/schemas/requests.py   Modelos Pydantic v2 (fuente de verdad)
        │  python scripts/export_schema.py
        ▼
   JSON Schema  ($defs indexado por nombre de modelo)
        │  scripts/gen-types.mjs  (json-schema-to-typescript)
        ▼
src/lib/types.generated.ts   AUTO-GENERADO — no editar a mano
        │  se importa directamente en
        ▼
src/lib/api.ts  +  src/hooks/useApi.ts
```

Regeneralo despues de cambiar cualquier modelo en `requests.py`:

```bash
node scripts/cli.js gen-types
# o
npm run gen:types
```

Haz commit del diff resultante en `types.generated.ts` — esta versionado en git para
que no haga falta un checkout completo / venv solo para compilar el frontend (por
ejemplo, en el stage de build del Dockerfile del frontend o en CI).
`scripts/export_schema.py` tambien se puede correr solo si necesitas el JSON
Schema crudo para otro consumidor (`python scripts/export_schema.py --out schema.json`).

---

## Modelos de base de datos

| Tabla | Descripcion |
|-------|-------------|
| `scraper_jobs` | Jobs de scraping: estado, config, ruta del resultado, tiempos |
| `scraper_profiles` | Configuraciones reutilizables de scraper |
| `pipelines` | Definiciones de pipelines ETL (JSON de ReactFlow) |
| `pipeline_runs` | Historial de ejecuciones por pipeline |
| `datasets` | Metadata de datasets, referencias a archivos Parquet |
| `ml_models` | Registro de modelos entrenados: metricas, rutas de artefactos |
| `job_logs` | Lineas de log en streaming por job |
| `export_jobs` | Registros de tareas de exportacion asincrona |

---

## Motores de scraping

| Motor | Ideal para | Soporte JS | Velocidad |
|-------|-----------|-----------|----------|
| `auto` | Seleccion automatica (recomendado) | Detectado | Variable |
| `playwright` | SPAs, apps React/Vue/Angular | Completo | Medio |
| `selenium` | Formularios, flujos de auth, clics | Completo | Lento |
| `requests` | HTML estatico, APIs REST | No | Rapido |
| `cloudscraper` | Sitios protegidos con Cloudflare | Limitado | Medio |
| `scrapy` | Crawling multi-URL a gran escala | No | Muy rapido |

Logica de seleccion automatica:
1. Peticion HEAD para sondear la URL
2. Detectar Cloudflare (header `cf-ray`, challenge JS)
3. Detectar contenido JS intensivo (`window.__NEXT_DATA__`, marcadores Vue/React)
4. Fallback en orden: `playwright -> cloudscraper -> requests`

---

## Sidecar de rate-limit / dedup (Rust)

`ratelimiter/` es un servicio **Rust + Axum** independiente que le da al pipeline
de scraping dos cosas que el lado Python no hace bien por si solo: **rate-limiting**
por dominio y **deduplicacion** de URLs en una ventana corta, consistentes entre
*todos* los procesos worker de Celery (en Linux/macOS la cola de scraping corre en 4
procesos separados; el estado en memoria de Python no se compartiria entre ellos). El
estado vive en Redis (DB 3, aislada de las DBs de cache/broker/results en 0/1/2).

Sigue el mismo patron que en los otros proyectos del autor: un servicio hermano
aislado al que se llega por HTTP/JSON en localhost, autenticado con un header
`x-api-key` compartido, y **fail-open** — el cliente Python
([`app/core/ratelimiter_client.py`](app/core/ratelimiter_client.py)) tiene un timeout
corto (~500 ms) y, si el sidecar esta lento o caido, loguea un warning y deja seguir
el scrape. Un caido del sidecar nunca bloquea ni falla un job; solo perdes
temporalmente el rate-limiting/dedup compartido.

| Endpoint | Auth | Proposito |
|----------|------|-----------|
| `GET /health` | no | Liveness — siempre `200` si esta arriba; reporta la conectividad a Redis en el body |
| `POST /rate/check` | si | Contador atomico por-segundo y por-dominio (`INCR`+`EXPIRE` via script Lua). Devuelve `{allowed, current, limit, retry_after_ms}` |
| `POST /dedup/check` | si | Check-and-mark atomico (`SET … NX EX`), indexado por `sha256(url)`, con ventana TTL. Devuelve `{seen, ttl_secs}` |

El gate se invoca una vez por URL desde el chokepoint `scrape()` del motor: si una URL
es duplicada dentro de la ventana, el job hace short-circuit a un resultado `completed`
con `rows=0` / `pages=0` (logueado como `skipped_reason:
duplicate_url_within_window`); si no, scrapea normalmente.

Correrlo solo (necesita Rust/Cargo + Redis):
```bash
node scripts/cli.js ratelimiter    # o: cd ratelimiter && cargo run
```
Tambien arranca automaticamente como parte de `node scripts/cli.js dev` cuando `cargo`
esta en el `PATH`. La configuracion es via variables `RATELIMITER_*` (ver
[Referencia de configuracion](#referencia-de-configuracion)).

> **Limitaciones v1 (documentadas):** el limite por-dominio es un unico global
> `RATELIMITER_DEFAULT_MAX_RPS` (conectar el `rate_limit` por-perfil es un follow-up);
> el loop de paginacion interno de Playwright hace varios fetches por llamada a
> `scrape()` que no pasan cada uno por el gate; el endpoint de preview `test_url`
> saltea el gate por completo.

---

## Referencia de API

URL base: `http://localhost:5050/api/v1`
Docs interactivos: `http://localhost:5050/api/docs/`

### Health
```
GET  /health/                    Estado del sistema + conectividad de servicios
GET  /health/metrics             CPU, memoria, disco, Redis, estadisticas de DB
```

### Scraper
```
GET  /scraper/jobs               Listar todos los jobs (paginacion, filtros)
POST /scraper/jobs               Crear un nuevo job de scraping
GET  /scraper/jobs/:id           Detalles del job + progreso
DEL  /scraper/jobs/:id           Cancelar / eliminar job
GET  /scraper/jobs/:id/results   Descargar resultado (Parquet/JSON/CSV)
POST /scraper/test-url           Probar accesibilidad de URL + motor recomendado
```

### Tablas (Datasets)
```
GET  /tables/datasets            Listar datasets subidos
POST /tables/datasets/upload     Subir CSV / Parquet / Excel
GET  /tables/datasets/:id        Esquema del dataset + preview de filas
DEL  /tables/datasets/:id        Eliminar dataset
GET  /tables/datasets/:id/export/:fmt   Exportar (csv|json|parquet|xlsx)
POST /tables/datasets/:id/query  Ejecutar query DuckDB SQL sobre el dataset
```

### Analytics
```
POST /analytics/profile          Perfil EDA (YData / Pandas Profiling)
POST /analytics/chart            Generar grafico Plotly / Matplotlib
POST /analytics/correlations     Matriz de correlacion
POST /analytics/anomalies        Deteccion de anomalias
```

### AI / ML
```
POST /ai/train                   Entrenar modelo (XGBoost, LightGBM, TF, sklearn)
POST /ai/predict                 Ejecutar prediccion sobre nuevos datos
POST /ai/forecast                Prediccion de serie de tiempo (Prophet)
GET  /ai/models                  Listar modelos entrenados
GET  /ai/models/:id              Detalles del modelo + metricas
DEL  /ai/models/:id              Eliminar modelo
```

### Pipelines
```
GET  /pipelines                  Listar pipelines ETL
POST /pipelines                  Crear pipeline (definicion ReactFlow)
GET  /pipelines/:id              Detalles del pipeline
PUT  /pipelines/:id              Actualizar pipeline
POST /pipelines/:id/run          Ejecutar pipeline
GET  /pipelines/:id/runs         Historial de ejecuciones
```

### Monitor
```
GET  /monitor/jobs               Estado de la cola de jobs en vivo
GET  /monitor/workers            Estado de workers Celery
GET  /monitor/system             CPU / memoria / disco (en vivo)
GET  /monitor/logs/:job_id       Logs en streaming para un job
```

---

## Referencia de configuracion

### Variables de entorno

```env
# -- Aplicacion ---------------------------------------------------
APP_ENV=development           # development | production | test
APP_SECRET_KEY=               # requerido en produccion
APP_PORT=5050
APP_DEBUG=false

# -- Bases de datos -----------------------------------------------
DATABASE_URL=postgresql://postgres:pass@localhost:5432/dataharvest
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
MONGO_URL=mongodb://localhost:27017/dataharvest  # opcional

# -- Scraping -----------------------------------------------------
PLAYWRIGHT_HEADLESS=true
REQUEST_TIMEOUT=30
MAX_CONCURRENT_SCRAPERS=10
USER_AGENT_ROTATE=true
PROXY_URL=                    # opcional: http://user:pass@proxy:puerto

# -- Sidecar rate-limit / dedup (Rust) ----------------------------
RATELIMITER_HOST=localhost
RATELIMITER_PORT=8090
RATELIMITER_REDIS_URL=redis://localhost:6379/3   # DB 3 — aislada de cache/broker/results
RATELIMITER_API_KEY=change-me-ratelimiter-shared-secret
RATELIMITER_DEFAULT_MAX_RPS=2                     # tope de peticiones/seg por dominio
RATELIMITER_DEDUP_TTL_SECS=3600                   # ventana de dedup de URLs

# -- Almacenamiento -----------------------------------------------
STORAGE_BACKEND=local         # local | s3 | azure
S3_BUCKET=
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AZURE_STORAGE_CONNECTION_STRING=

# -- Extensiones nativas ------------------------------------------
USE_RUST_EXTRACTOR=false      # activar extractor regex en Rust (PyO3)
USE_ZIG_PARSER=false          # activar parser streaming en Zig
USE_ASM_HASH=false            # activar hash FNV en ASM (solo x86-64)

# -- AI / ML ------------------------------------------------------
OPENAI_API_KEY=
HUGGINGFACE_TOKEN=
MLFLOW_TRACKING_URI=http://localhost:5001

# -- Monitoreo ----------------------------------------------------
FLOWER_PORT=5555
SENTRY_DSN=                   # opcional
```

---

## Servicios Docker

| Servicio | Puerto | Descripcion |
|----------|--------|-------------|
| `api` | 5050 | Flask REST API + SocketIO |
| `worker-scraping` | --- | Worker Celery (cola scraping, 4 workers) |
| `worker-ai` | --- | Worker Celery (colas ai + analytics, 2 workers) |
| `worker-general` | --- | Worker Celery (colas pipelines + exports + monitoring) |
| `beat` | --- | Scheduler de tareas periodicas Celery |
| `ratelimiter` | 8090 | Sidecar Rust/Axum de rate-limit + dedup de URLs |
| `flower` | 5555 | UI de monitoreo de Celery |
| `frontend` | 80, 443 | Nginx + build de produccion Vite |
| `postgres` | 5432 | PostgreSQL 16 |
| `redis` | 6379 | Redis 7 (persistencia AOF) |
| `mongo` | 27017 | MongoDB 7 |
| `mlflow` | 5001 | Servidor de seguimiento MLflow |

---

## Tests

```bash
# Backend — suite completa
pytest tests/ -v --cov=app --cov-report=term-missing

# Modulo especifico
pytest tests/test_scraper.py -v

# Tests de integracion (requiere DB + Redis en ejecucion)
pytest tests/integration/ -v --env=test

# Tests de frontend
npm run test
```

O via el CLI: `node scripts/cli.js test` (backend) / `node scripts/cli.js test frontend`.

---

## Contribuir

1. **Fork** del repositorio
2. **Crear** una rama: `git checkout -b feature/mi-feature`
3. **Escribir tests** para la nueva funcionalidad, especialmente para extensiones nativas
4. **Compilar Cython** si modificaste archivos `.pyx`: `python setup.py build_ext --inplace`
5. **Ejecutar linters**: `make lint && make type-check`
6. **Ejecutar tests**: `make test`
7. **Commit** con un mensaje descriptivo
8. **Abrir un Pull Request** contra `main`

### Agregar una extension nativa

Al contribuir una funcionalidad critica para el rendimiento, considera una implementacion nativa:

- **Cython** — para codigo cercano a Python con NumPy o memory views
- **C/C++** — para parsing puro, hashing o compresion
- **Rust** — para concurrencia segura, regex o operaciones criptograficas
- **Zig** — para programacion de sistemas sin GC, con seguridad de memoria
- **ASM** — solo para cuellos de botella verificados donde SIMD da una ganancia medible

Cada modulo nativo debe tener:
- Un fallback en Python puro en el mismo archivo
- Un test unitario que valide que la salida coincide con la referencia Python
- Un script de benchmark en `benchmarks/`

---

## Roadmap

El roadmap esta organizado por area de enfoque. Cada item incluye el **lenguaje / tecnologia objetivo** elegido para ese problema especifico.

Leyenda: `[ ]` planificado &nbsp;·&nbsp; `[~]` en progreso &nbsp;·&nbsp; `[x]` completado

---

### Motor de Scraping

> Objetivo: parsear cualquier pagina, a cualquier escala, con minima latencia por peticion.

| Estado | Item | Lenguaje / Tecnologia | Por que |
|--------|------|-----------------------|---------|
| `[ ]` | Tokenizador HTML5 en streaming para paginas >1 GB | **Zig** | Zero-allocation, layout de memoria en tiempo de compilacion, sin pausas GC |
| `[ ]` | Pipeline de extraccion regex paralelo | **Rust** (rayon + regex crate) | Paralelismo real, DFA acelerado por SIMD, memoria segura |
| `[~]` | Dedup de URLs compartida entre workers | **Rust** (Axum) + Redis | Entregado como el sidecar `ratelimiter/` — dedup atomico `SET NX EX` por hash con ventana TTL; una variante con Bloom filter queda como refinamiento |
| `[ ]` | Fingerprinting de URLs FNV-1a / xxHash | **x86-64 ASM** (AVX2) | Vectorizado: 8 URLs/ciclo de rendimiento |
| `[ ]` | Cliente HTTP/3 (QUIC) para scraping | **Rust** (quinn) | Reconexiones 0-RTT, streams multiplexados, sin head-of-line blocking |
| `[ ]` | Rotacion de fingerprint de navegador a nivel TLS | **C** (libcurl + openssl) | Control TLS fino no disponible en Python |
| `[ ]` | Parser HTML WASM para preview en navegador | **Zig compilado a WASM** | Mismo tokenizador enviado al browser sin reescritura en JS |
| `[ ]` | Crawler distribuido (malla multi-nodo Celery) | **Python** + Redis Streams | Escala horizontal, dedup compartida entre workers |
| `[ ]` | SDK de plugins para motores de scraping custom | **Python** (ABC + entry_points) | Motores de terceros sin hacer fork del repo |

---

### Procesamiento de datos y almacenamiento

> Objetivo: procesar terabytes en memoria y enviar bytes al almacenamiento a velocidad de red.

| Estado | Item | Lenguaje / Tecnologia | Por que |
|--------|------|-----------------------|---------|
| `[ ]` | Serializador CSV vectorizado | **C++17** (intrinsics SIMD) | 10x mas rapido que el modulo `csv` de Python en exportacion masiva |
| `[ ]` | Streaming de datasets con Arrow Flight (zero-copy) | **Rust** (arrow2 + flight) | Sin overhead de serde: buffers columnares enviados directamente |
| `[ ]` | Soporte Delta Lake (ACID en S3/GCS) | **Rust** (delta-rs) | Sobrescrituras transaccionales, evolucion de esquema, time travel |
| `[ ]` | Motor de queries con predicate pushdown en Parquet | **Zig** + Arrow IPC | Consultas WHERE en sub-segundo sin cargar el archivo completo |
| `[ ]` | Capa de integridad de datos CRC32C | **x86-64 ASM** (SSE4.2) | Instruccion hardware `crc32`: 1 byte/ciclo |
| `[ ]` | Compresion Zstd con diccionario por dominio | **C** (libzstd) | Diccionario entrenado en datos del dominio: 3x mejor ratio |
| `[ ]` | Vistas materializadas en ClickHouse | **SQL + ClickHouse** | Rollups en tiempo real sobre streams de datos scrapeados |
| `[ ]` | Puente zero-copy DuckDB / Polars (Arrow) | **C++** + pybind11 | Buffer Arrow compartido entre motores sin copia |

---

### Analytics y Visualizacion

> Objetivo: de bytes crudos a insights en un pipeline, explorable completamente en el navegador.

| Estado | Item | Lenguaje / Tecnologia | Por que |
|--------|------|-----------------------|---------|
| `[ ]` | Estadisticas de resumen aceleradas con SIMD | **C** (AVX2) via Cython memoryview | min/max/media/stddev en un solo paso cache-friendly |
| `[ ]` | Heavy-hitters aproximados (Count-Min Sketch) | **Rust** | Actualizaciones concurrentes lock-free, FFI seguro a Python |
| `[ ]` | Deteccion de anomalias en series de tiempo (z-score) | **Python** + **Cython** ruta critica | Bucle ventaneado compilado: sin overhead Python por fila |
| `[ ]` | Renderizado de graficos en GPU (10M+ puntos) | **GLSL** (WebGL / regl) | Scatter plot a 60 fps en el navegador, sin round-trip al servidor |
| `[ ]` | Tabla pivot en canvas (sin DOM) | **TypeScript** + OffscreenCanvas | Sin overhead de reconciliacion React por fila de datos |
| `[ ]` | Celdas SQL notebook (DuckDB WASM) | **DuckDB compilado con Zig** + TypeScript | Queries completamente client-side, sin backend necesario |
| `[ ]` | Matriz de correlacion con p-values | **C** (BLAS/LAPACK) via NumPy | matmul nativo BLAS: ordenes de magnitud mas rapido que Python puro |

---

### ML / AI Studio

> Objetivo: entrenar, evaluar y servir modelos en la capa de datos, sin cluster MLOps separado.

| Estado | Item | Lenguaje / Tecnologia | Por que |
|--------|------|-----------------------|---------|
| `[ ]` | Feature store (joins correctos en el tiempo) | **Rust** (polars-core) | Corritud de join temporal, sin contention GIL en frames grandes |
| `[ ]` | Pipeline AutoML (HPO + ensamblado) | **Python** + Optuna + **C** sampler | Sampler TPE de Optuna en C: 5x mas trials/seg |
| `[ ]` | Endpoint de inferencia ONNX Runtime | **C++** (onnxruntime) | Inferencia CPU <5 ms p99, sin overhead de TF/PyTorch |
| `[ ]` | Generador de configuracion de scraper asistido por LLM | **Python** + API Anthropic | Describe el sitio en texto plano, recibe un `ScrapeConfig` |
| `[ ]` | Deteccion de contenido duplicado por embeddings | **Rust** (fastembed-rs) | Embed en batch + dedup por coseno, sin overhead del GIL Python |
| `[ ]` | Inferencia LLM en streaming (SSE fragmentado) | **Python** + Flask SSE | Streaming de tokens en tiempo real al frontend |
| `[ ]` | Serving de modelos cuantizados (INT8 / FP16) | **C++** + OpenBLAS | matmul en media precision: 2x throughput en nodos CPU |
| `[ ]` | Scraping federado + ML local (nodos edge) | **Rust** + gRPC | Los nodos entrenan localmente y agregan gradientes: los datos crudos no salen del nodo |

---

### Pipelines y ETL

> Objetivo: componer flujos de datos arbitrariamente complejos de forma visual y ejecutarlos de forma confiable.

| Estado | Item | Lenguaje / Tecnologia | Por que |
|--------|------|-----------------------|---------|
| `[ ]` | API de ejecucion de pipelines con gRPC | **Python** + Protobuf | Contratos tipados y versionados, reemplaza REST para llamadas inter-servicio |
| `[ ]` | Deteccion de ciclos en DAG al guardar | **Rust** (petgraph) | DFS correcta en tiempo de compilacion, expuesta como llamada de validacion Python |
| `[ ]` | Ejecuciones incrementales / delta | **Python** + snapshots Parquet | Solo reprocesar particiones cambiadas, omitir las iguales |
| `[ ]` | Pipeline como codigo (DSL YAML / TOML) | **Python** + PyYAML | Definiciones de pipeline versionables y con diff |
| `[ ]` | Nodos de transformacion en streaming (fuente Kafka) | **Python** + confluent-kafka | Agregaciones con estado sobre topics en vivo |
| `[ ]` | Estimador de costo del pipeline (tiempo + memoria) | **Zig** + analisis estatico | Predecir uso de recursos antes de ejecutar, prevenir OOM kills |
| `[ ]` | Generacion de codigo PySpark / Polars desde nodos ReactFlow | **TypeScript** + **Python** | Pipeline visual compila a una cadena de computo ejecutable |

---

### API e Infraestructura Backend

> Objetivo: 10 k req/s en un solo nodo, completamente observable, despliegues sin downtime.

| Estado | Item | Lenguaje / Tecnologia | Por que |
|--------|------|-----------------------|---------|
| `[ ]` | Trazas OpenTelemetry (Jaeger / Tempo) | **Python** (opentelemetry-sdk) | Trazas distribuidas a traves de Flask + Celery + workers |
| `[ ]` | Metricas Prometheus + dashboard Grafana | **Python** (prometheus-client) | CPU/memoria/jobs, alertas ante brecha de SLA |
| `[x]` | Rate limiter de scraping saliente en Redis | **Rust** (Axum) + **Lua** (atomics scripted en Redis) | Entregado como `ratelimiter/` — ventana fija atomica `INCR`+`EXPIRE` por dominio, compartida entre workers, fail-open (la precision token-bucket queda como refinamiento) |
| `[ ]` | Despliegues rolling sin downtime | **Python** + Gunicorn + Nginx | Reinicio graceful de workers, sin conexiones caidas |
| `[ ]` | Migracion JWT a OAuth 2.0 / OIDC | **Python** (Authlib) | Identidad multi-tenant y agnositca al proveedor |
| `[ ]` | Sandbox WebAssembly para plugins | **Rust** (wasmtime) | Codigo de transformacion del usuario aislado con limites de CPU/memoria |
| `[ ]` | Streaming de resultados de tareas via SSE | **Python** + Flask + Redis Pub/Sub | Push de actualizaciones Celery al frontend sin polling |

---

### Frontend y UI

> Objetivo: una UI que se sienta rapida como una app nativa, incluso con cientos de miles de filas en vivo.

| Estado | Item | Lenguaje / Tecnologia | Por que |
|--------|------|-----------------------|---------|
| `[ ]` | Tabla de datos virtualizada (1M+ filas) | **TypeScript** + canvas | Renderizado sin DOM, sin overhead del VDOM de React por fila |
| `[ ]` | Parser CSV WASM en el navegador (200 MB+) | **Zig compilado a WASM** | Parsear archivos grandes en el cliente en <1 s, sin necesidad de subir |
| `[ ]` | Modo offline (IndexedDB + Service Worker) | **TypeScript** + Workbox | Cache de datasets local, queries DuckDB WASM sin conexion |
| `[ ]` | Command palette (Cmd+K, navegacion fuzzy) | **TypeScript** + cmdk | Navegacion instantanea entre todos los modulos y datasets |
| `[ ]` | Data grid responsive (mobile-first) | **TypeScript** + CSS Grid | Columnas fijas, swipe tactil, ocultacion adaptiva de columnas |
| `[ ]` | Editor de temas custom (exportar JSON) | **TypeScript** + CSS custom properties | Compartir temas con marca propia con el equipo |
| `[ ]` | PWA + notificaciones push al terminar jobs | **TypeScript** + Web Push API | Notificar cuando un scrape termina, incluso con el browser cerrado |

---

### DevOps y Despliegue

> Objetivo: un comando del laptop a produccion, builds reproducibles bit a bit.

| Estado | Item | Lenguaje / Tecnologia | Por que |
|--------|------|-----------------------|---------|
| `[ ]` | Helm chart para Kubernetes | **YAML** + Helm 3 | Despliegues parametrizados multi-entorno, autoscaling HPA |
| `[ ]` | Shell de desarrollo con Nix flake | **Nix** | Entorno reproducible: Python + Rust + Zig + ASM, identico en cada maquina |
| `[ ]` | Cross-compilar extensiones nativas a musl | **Zig** (cross-compile integrado) | Binario estatico, sin dependencia de libc en contenedores Alpine |
| `[ ]` | Matriz CI: Python 3.11-3.13 x Linux/macOS/Win | **GitHub Actions** | Detectar regresiones de Cython / C ABI especificas de plataforma |
| `[ ]` | Benchmarks reproducibles en CI | **Python** + pytest-benchmark | Bloquear merge si algun benchmark regresa mas del 10% |

---

## Licencia

MIT — Desarrollado por [Brashkie / Hepein Oficial](https://github.com/Brashkie)

> El rendimiento es una caracteristica. DataHarvest usa el lenguaje correcto para cada problema: Python para la orquestacion, Cython/C para las rutas criticas, Rust para la concurrencia segura, Zig para el trabajo de sistemas, y ASM solo donde el hardware lo exige.
