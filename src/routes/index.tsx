import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/AppShell'

// Silencia warnings de Recharts
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('width(-1) and height(-1)')) return
    originalError(...args)
  }
}



export const Route = createFileRoute('/')({
  component: AppShell,
})