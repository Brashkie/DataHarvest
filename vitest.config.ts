import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// Deliberately separate from vite.config.ts: unit tests don't need the
// content-collections or TanStack Start SSR plugins, and pulling those in
// here breaks Vitest at startup (content-collections' esbuild-based config
// loader throws "__dirname is not defined" under Node's ESM runtime).
export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] }), viteReact()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
