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
  plugins: [
    devtools(),
    contentCollections(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})