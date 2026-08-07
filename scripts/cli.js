#!/usr/bin/env node
/**
 * DataHarvest — unified console CLI
 *
 * Cross-platform replacement/companion for the Makefile (Windows has no
 * `make`/`tmux` by default). Backend and frontend both live at the repo
 * root now, so every command below runs from ROOT — no more cwd-juggling
 * between backend/ and frontend/. Orchestrates backend, frontend, Celery
 * worker/beat/flower, Docker, tests, lint, migrations and the
 * Python -> TypeScript type bridge from a single entry point:
 *
 *   node scripts/cli.js <command> [...args]
 *   npm run cli -- <command> [...args]
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const WIN = process.platform === 'win32'
const VENV_DIR = path.join(ROOT, '.venv')

const COLORS = {
  backend: '\x1b[36m', // cyan
  frontend: '\x1b[35m', // magenta
  worker: '\x1b[33m', // yellow
  beat: '\x1b[32m', // green
  ratelimiter: '\x1b[34m', // blue
  reset: '\x1b[0m',
}

function venvBin(name) {
  return path.join(VENV_DIR, WIN ? 'Scripts' : 'bin', WIN ? `${name}.exe` : name)
}

function pythonBin() {
  const venvPython = venvBin('python')
  if (existsSync(venvPython)) return venvPython
  return WIN ? 'python' : 'python3'
}

function celeryBin() {
  const venvCelery = venvBin('celery')
  if (existsSync(venvCelery)) return venvCelery
  return 'celery'
}

function npmBin() {
  return WIN ? 'npm.cmd' : 'npm'
}

/** Rust toolchain has no venv-style binary to resolve — just check cargo is on PATH. */
function hasCargo() {
  const probe = spawnSync(WIN ? 'where' : 'which', ['cargo'], { shell: WIN })
  return probe.status === 0
}

function ratelimiterArgs() {
  return ['run', '--quiet', '--manifest-path', path.join(ROOT, 'ratelimiter', 'Cargo.toml')]
}

/** Foreground task — inherits stdio, this process exits with its code. */
function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: WIN,
    cwd: opts.cwd ?? ROOT,
    env: { ...process.env, ...opts.env },
  })
  if (result.error) {
    console.error(`[dataharvest] failed to run "${command}": ${result.error.message}`)
    process.exit(1)
  }
  process.exit(result.status ?? 0)
}

/** Background task used by runParallel — piped stdio, line-prefixed. */
function spawnLabeled(name, command, args, opts = {}) {
  const child = spawn(command, args, {
    cwd: opts.cwd ?? ROOT,
    env: { ...process.env, ...opts.env },
    shell: WIN,
  })
  const color = COLORS[name] ?? ''
  const prefix = `${color}[${name}]${COLORS.reset} `

  const pipeLines = (stream, out) => {
    let buf = ''
    stream.on('data', (chunk) => {
      buf += chunk.toString()
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) out.write(prefix + line + '\n')
    })
    stream.on('end', () => {
      if (buf) out.write(prefix + buf + '\n')
    })
  }
  pipeLines(child.stdout, process.stdout)
  pipeLines(child.stderr, process.stderr)
  return child
}

/**
 * Run several labeled tasks concurrently; Ctrl+C kills all of them.
 * A task marked `critical: false` (e.g. the Celery worker — needs Redis,
 * which not every dev setup has running) is allowed to fail without taking
 * the rest of the session down with it; critical tasks (backend, frontend)
 * still trigger a full shutdown if they die.
 */
function runParallel(tasks) {
  const children = tasks.map((t) => ({
    task: t,
    proc: spawnLabeled(t.name, t.command, t.args, t.opts),
  }))
  let shuttingDown = false

  const shutdown = () => {
    if (shuttingDown) return
    shuttingDown = true
    for (const { proc } of children) {
      if (!proc.killed) proc.kill(WIN ? undefined : 'SIGTERM')
    }
  }

  process.on('SIGINT', () => {
    console.log('\n[dataharvest] stopping all processes...')
    shutdown()
  })
  process.on('SIGTERM', shutdown)

  let remaining = children.length
  let exitCode = 0
  for (const { task, proc } of children) {
    proc.on('exit', (code) => {
      remaining -= 1
      const critical = task.critical !== false
      if (code && code !== 0) {
        if (critical) exitCode = code
        console.error(
          `[dataharvest] [${task.name}] exited with code ${code}${critical ? '' : ' (non-critical — other processes keep running)'}`,
        )
      }
      if (!shuttingDown && code && code !== 0 && critical) {
        shutdown()
      }
      if (remaining === 0) process.exit(exitCode)
    })
  }
}

function celeryArgs(sub) {
  const queues = 'scraping,pipelines,analytics,ai,exports,monitoring,maintenance'
  if (sub === 'worker') {
    // Celery's default "prefork" pool needs os.fork(), which doesn't exist on
    // Windows — it fails outright there. Windows must use --pool=solo (single
    // threaded, so -c/--concurrency doesn't apply); other platforms keep prefork.
    return WIN
      ? ['-A', 'run.celery', 'worker', '-Q', queues, '--pool=solo', '--loglevel=info']
      : ['-A', 'run.celery', 'worker', '-Q', queues, '-c', '4', '--loglevel=info']
  }
  if (sub === 'beat') return ['-A', 'run.celery', 'beat', '--loglevel=info']
  if (sub === 'flower') return ['-A', 'run.celery', 'flower', '--port=5555']
  throw new Error(`unknown celery subcommand: ${sub}`)
}

const commands = {
  dev() {
    const tasks = [
      {
        name: 'backend',
        command: pythonBin(),
        args: ['run.py', '--env', 'development', '--debug'],
      },
      {
        name: 'frontend',
        command: npmBin(),
        args: ['run', 'dev:frontend'],
      },
      {
        // Scraper/pipeline/AI jobs are dispatched as Celery tasks — without a
        // worker consuming the queue they just sit at "Pending" forever. Not
        // critical (needs Redis, which not every machine has running), so it
        // won't take backend/frontend down with it if it can't connect.
        name: 'worker',
        command: celeryBin(),
        args: celeryArgs('worker'),
        critical: false,
      },
    ]
    if (hasCargo()) {
      // Rate-limit/dedup sidecar for the scraper pipeline. Not critical — the
      // Python-side client fails open if this is unreachable, so a dev
      // machine without Rust installed just runs without shared rate-limiting.
      tasks.push({
        name: 'ratelimiter',
        command: 'cargo',
        args: ratelimiterArgs(),
        critical: false,
      })
    } else {
      console.warn('[dataharvest] cargo not found on PATH — skipping the ratelimiter sidecar (scraping falls back to no shared rate-limit/dedup)')
    }
    runParallel(tasks)
  },

  backend(args) {
    run(pythonBin(), ['run.py', '--env', 'development', '--debug', ...args])
  },

  frontend(args) {
    run(npmBin(), ['run', 'dev:frontend', ...args])
  },

  worker() {
    run(celeryBin(), celeryArgs('worker'))
  },

  ratelimiter() {
    run('cargo', ratelimiterArgs())
  },

  beat() {
    run(celeryBin(), celeryArgs('beat'))
  },

  flower() {
    run(celeryBin(), celeryArgs('flower'))
  },

  'worker+beat'() {
    runParallel([
      { name: 'worker', command: celeryBin(), args: celeryArgs('worker') },
      { name: 'beat', command: celeryBin(), args: celeryArgs('beat') },
    ])
  },

  docker(args) {
    run('docker', ['compose', 'up', '--build', '-d', ...args])
  },

  'docker:down'(args) {
    run('docker', ['compose', 'down', ...args])
  },

  test(args) {
    const target = args[0]
    if (target === 'frontend') {
      run(npmBin(), ['run', 'test'])
      return
    }
    if (target === 'backend' || !target) {
      run(pythonBin(), ['-m', 'pytest', 'tests/', '-v', '--cov=app', '--cov-report=term-missing'])
      return
    }
    console.error(`unknown test target: ${target} (expected "backend" or "frontend")`)
    process.exit(1)
  },

  lint() {
    run(pythonBin(), ['-m', 'black', 'app/'])
    run(pythonBin(), ['-m', 'ruff', 'check', 'app/', '--fix'])
  },

  migrate() {
    run('flask', ['--app', 'run', 'db', 'upgrade'])
  },

  seed() {
    run(pythonBin(), ['scripts/seed_demo_data.py'])
  },

  'build-ext'() {
    run(pythonBin(), ['setup.py', 'build_ext', '--inplace'])
  },

  'gen-types'() {
    run(npmBin(), ['run', 'gen:types'])
  },

  install() {
    if (!existsSync(venvBin('python'))) {
      console.log('[dataharvest] no venv found — creating one at ./.venv ...')
      const sysPython = WIN ? 'python' : 'python3'
      const created = spawnSync(sysPython, ['-m', 'venv', '.venv'], { stdio: 'inherit', cwd: ROOT, shell: WIN })
      if (created.error || created.status !== 0) {
        console.error('[dataharvest] failed to create venv — install Python 3.11+ and make sure it is on PATH')
        process.exit(created.status ?? 1)
      }
    }
    run(pythonBin(), ['-m', 'pip', 'install', '-r', 'requirements.txt'])
  },

  help() {
    console.log(`
  DataHarvest — console CLI (cross-platform, no make/tmux required)
  ───────────────────────────────────────────────────────────────────
  node scripts/cli.js <command>        or   npm run cli -- <command>

  dev              Start backend + frontend + Celery worker (+ ratelimiter sidecar if cargo is installed), labeled/colorized output
  backend          Start Flask API only (http://localhost:5050)
  frontend         Start Vite dev server only (http://localhost:3000)
  worker           Start Celery worker (all queues)
  beat             Start Celery beat scheduler
  ratelimiter      Start the Rust rate-limiter/dedup sidecar (http://localhost:8090, requires cargo)
  flower           Start Flower monitoring UI (http://localhost:5555)
  worker+beat      Start worker and beat together
  docker           docker compose up --build -d
  docker:down      docker compose down
  test [backend|frontend]   Run test suite (defaults to backend)
  lint             black + ruff on app/
  migrate          flask db upgrade
  seed             Seed demo data
  build-ext        Compile Cython extensions
  gen-types        Regenerate src/lib/types.generated.ts from backend Pydantic schemas
  install          Install backend + frontend dependencies (creates ./.venv if missing)
  help             Show this message
`)
  },
}

async function main() {
  const [, , cmd, ...rest] = process.argv
  const handler = commands[cmd]
  if (!handler) {
    if (cmd) console.error(`[dataharvest] unknown command: ${cmd}\n`)
    commands.help()
    process.exit(cmd ? 1 : 0)
  }
  await handler(rest)
}

main()
