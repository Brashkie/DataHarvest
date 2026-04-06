import { useState, useEffect, useCallback } from 'react'
import { TourTooltip } from './TourTooltip'
import { TourSpotlight } from './TourSpotlight'
import { GENERAL_TOUR, ALL_TOURS } from './tours'
import { useStore } from '#/stores/appStore'

const STORAGE_KEY = 'dh-tours-done'

function getDoneTours(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function markTourDone(id: string) {
  const done = getDoneTours()
  if (!done.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done, id]))
  }
}

export function TourManager() {
  const { module } = useStore()
  const [activeTour, setActiveTour] = useState<string | null>(null)
  const [stepIndex, setStepIndex]   = useState(0)

  // Start general tour on first visit
  useEffect(() => {
    const done = getDoneTours()
    if (!done.includes('general')) {
      setTimeout(() => setActiveTour('general'), 1000)
    }
  }, [])

  // Start module tour when entering a new module
  useEffect(() => {
    if (!activeTour && module !== 'dashboard') {
      const done = getDoneTours()
      if (!done.includes(module) && ALL_TOURS[module]) {
        setTimeout(() => {
          setActiveTour(module)
          setStepIndex(0)
        }, 600)
      }
    }
  }, [module])

  const tour = activeTour ? ALL_TOURS[activeTour] : null
  const steps = tour?.steps ?? []
  const step = steps[stepIndex]

  const handleNext = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(s => s + 1)
    } else {
      markTourDone(activeTour!)
      // After general tour, start dashboard tour
      if (activeTour === 'general') {
        setActiveTour('dashboard')
        setStepIndex(0)
      } else {
        setActiveTour(null)
        setStepIndex(0)
      }
    }
  }, [stepIndex, steps.length, activeTour])

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) setStepIndex(s => s - 1)
  }, [stepIndex])

  const handleSkip = useCallback(() => {
    markTourDone(activeTour!)
    setActiveTour(null)
    setStepIndex(0)
  }, [activeTour])

  if (!step) return null

  return (
    <>
      <TourSpotlight target={step.target} />
      <TourTooltip
        step={step}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
      />
    </>
  )
}

// Hook para reiniciar tours
export function useResetTours() {
  return () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('dh-onboarding-done')
    window.location.reload()
  }
}