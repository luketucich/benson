// Onboarding's screens, in order.
export const STEPS = [
  'welcome',
  'ready',
  'vault',
  'devices',
  'shortcut',
  'practice-panel',
  'practice-window',
  'done'
] as const

export type OnboardingStep = (typeof STEPS)[number]

// The two screens where you record a real note to learn how Benson works.
export function isPractice(step: OnboardingStep | null): boolean {
  return step === 'practice-panel' || step === 'practice-window'
}
