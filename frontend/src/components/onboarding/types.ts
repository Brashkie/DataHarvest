export interface TourStep {
  target: string        // CSS selector del elemento a resaltar
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
  page?: string         // módulo donde aplica
}

export interface TourConfig {
  id: string
  steps: TourStep[]
}