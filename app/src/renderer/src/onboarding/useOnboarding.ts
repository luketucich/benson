import { useCallback, useEffect, useRef, useState } from 'react'
import { isPractice, STEPS, type OnboardingStep } from './steps'

export interface OnboardingControls {
  // The screen showing, or null once onboarding is over.
  step: OnboardingStep | null
  // Only the download screen, to put back a piece that went missing.
  repair: boolean
  // The practice recording on screen now, shown in the real main window.
  practicing: number | null
  next: () => void
  finish: () => Promise<void>
  // The recording flow tells onboarding what happened to a recording.
  recorded: (id: number) => void
  saved: (id: number) => void
  discarded: (id: number) => void
}

// Decides whether onboarding shows, which screen is up, and follows the
// practice runs: a recording made on a practice screen counts once it's saved.
export function useOnboarding(): OnboardingControls {
  const [step, setStep] = useState<OnboardingStep | null>(null)
  const [repair, setRepair] = useState(false)
  const [practicing, setPracticing] = useState<number | null>(null)
  // Refs, because the recording flow reads these after awaits, when the
  // values from an older render would be out of date.
  const stepRef = useRef(step)
  const practiceIds = useRef<number[]>([])
  useEffect(() => {
    stepRef.current = step
  }, [step])

  useEffect(() => {
    void window.api.getSetup().then(({ onboarding, pieces }) => {
      if (onboarding) return setStep('welcome')
      // Something went missing since setup: only fix that.
      if (pieces.some((piece) => piece.state !== 'ready')) {
        setRepair(true)
        setStep('ready')
      }
    })
  }, [])

  // The same function every render, so screens can safely depend on it.
  const next = useCallback(() => {
    setPracticing(null)
    if (repair) {
      setRepair(false)
      setStep(null)
      return
    }
    setStep((current) => (current ? (STEPS[STEPS.indexOf(current) + 1] ?? current) : current))
  }, [repair])

  return {
    step,
    repair,
    practicing,
    next,
    finish: async () => {
      await window.api.finishSetup()
      practiceIds.current = []
      setStep(null)
    },
    recorded: (id) => {
      if (!isPractice(stepRef.current)) return
      practiceIds.current.push(id)
      setPracticing(id)
    },
    saved: (id) => {
      if (!isPractice(stepRef.current) || !practiceIds.current.includes(id)) return
      // You saved in the pop-up from another app, so bring Benson back for the
      // next step once "Saved" has had a moment.
      if (stepRef.current === 'practice-panel') setTimeout(window.api.showWindow, 1200)
      next()
    },
    // Back to the instructions, to try again.
    discarded: (id) => {
      if (isPractice(stepRef.current) && practiceIds.current.includes(id)) setPracticing(null)
    }
  }
}
