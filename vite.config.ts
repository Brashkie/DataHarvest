import { createLogger, defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import contentCollections from '@content-collections/vite'

const logger = createLogger()
const originalWarn = logger.warn.bind(logger)
const originalInfo = logger.info.bind(logger)
const originalError = logger.error.bind(logger)

logger.warn = (msg, options) => {
  if (msg.includes('width(-1)')) return
  originalWarn(msg, options)
}
logger.info = (msg, options) => {
  if (msg.includes('width(-1)')) return
  originalInfo(msg, options)
}
logger.error = (msg, options) => {
  if (msg.includes('width(-1)')) return
  originalError(msg, options)
}

export default defineConfig({
  customLogger: logger,
  // The Python venv, backend app code, and data dirs now live alongside
  // src/ at the repo root — keep Vite's watcher/scanner out of them, since
  // venv alone can hold hundreds of thousands of files (torch, tensorflow, ...)
  // and starves module-transform requests if chokidar tries to crawl it.
  // (The venv itself is named `.venv` — dot-prefixed — because
  // @content-collections/vite's own internal watcher also crawls the repo
  // root looking for content-collections.ts changes, and only its dot-path
  // check keeps it out; this server.watch.ignored list only covers Vite's
  // own watcher.)
  server: {
    watch: {
      ignored: ['**/.venv/**', '**/app/**', '**/data/**', '**/exports/**', '**/logs/**', '**/wheels/**'],
    },
  },
  plugins: [
    devtools(),
    contentCollections(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})