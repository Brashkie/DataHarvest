import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient, useHealth, useLiveEvents } from '#/hooks/useApi'

import appCss from '../styles.css?url'
import { useCallback } from 'react'

// Silencia warnings de Recharts
if (typeof window !== 'undefined') {
  const origError = console.error
  const origWarn  = console.warn
  const filter = (msg: unknown) =>
    typeof msg === 'string' && (
      msg.includes('width(-1) and height(-1)') ||
      msg.includes('ERR_CONNECTION_RESET') ||
      msg.includes('Network Error') ||
      msg.includes('net::ERR')
    )

  console.error = (...args: unknown[]) => { if (filter(args[0])) return; origError(...args) }
  console.warn  = (...args: unknown[]) => { if (filter(args[0])) return; origWarn(...args)  }
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=JSON.parse(window.localStorage.getItem('dh-store')||'{}');var theme=stored?.state?.theme||'system';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=theme==='system'?(prefersDark?'dark':'light'):theme;document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(resolved);document.documentElement.style.colorScheme=resolved;}catch(e){document.documentElement.classList.add('dark');}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'DataHarvest Pro v2.0' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function AppInner() {
  useHealth()
  const onConnect    = useCallback(() => console.log('WS conectado'),    [])
  const onDisconnect = useCallback(() => console.log('WS desconectado'), [])

  useLiveEvents({  })

  
  return (
    <>
      <Outlet />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface-el)',
            color: 'var(--text-1)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '13px',
          },
          duration: 3500,
        }}
      />
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AppInner />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}