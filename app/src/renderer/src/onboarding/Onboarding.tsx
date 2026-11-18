import type { SettingsControls } from '../hooks/useSettings'
import type { ShortcutControls } from '../hooks/useShortcut'
import { Done } from './Done'
import { GettingReady } from './GettingReady'
import { PracticeStep } from './PracticeStep'
import { ShortcutStep } from './ShortcutStep'
import { VaultStep } from './VaultStep'
import { DevicesStep } from './DevicesStep'
import { Welcome } from './Welcome'
import { STEPS, type OnboardingStep } from './steps'

interface Props {
  step: OnboardingStep
  // Only the download screen, to put back a piece that went missing.
  repair: boolean
  // The practice note's thread, once you've recorded it.
  thread: React.ReactNode
  settings: SettingsControls
  shortcut: ShortcutControls
  onNext: () => void
  onFinish: () => void
}

// Setting Benson up, one screen at a time, in place of the main window.
export function Onboarding({
  step,
  repair,
  thread,
  settings,
  shortcut,
  onNext,
  onFinish
}: Props): React.JSX.Element {
  const keys = shortcut.state.label

  return (
    <main className="onboarding">
      {/* The window has no title bar, so this strip is where you drag it. */}
      <div className="onboarding-drag" />
      {/* Keyed by step, so each screen eases in. */}
      <div
        key={step}
        className={
          step === 'practice-window' && thread
            ? 'onboarding-step onboarding-step-wide'
            : 'onboarding-step'
        }
      >
        {step === 'welcome' && <Welcome onNext={onNext} />}
        {step === 'ready' && <GettingReady onNext={onNext} onSkip={repair ? onNext : undefined} />}
        {step === 'vault' && <VaultStep settings={settings} onNext={onNext} />}
        {step === 'devices' && <DevicesStep settings={settings} onNext={onNext} />}
        {step === 'shortcut' && <ShortcutStep shortcut={shortcut} onNext={onNext} />}
        {step === 'practice-panel' && (
          <PracticeStep kind="panel" shortcut={keys} thread={thread} onSkip={onNext} />
        )}
        {step === 'practice-window' && (
          <PracticeStep kind="window" shortcut={keys} thread={thread} onSkip={onNext} />
        )}
        {step === 'done' && <Done shortcut={keys} onFinish={onFinish} />}
      </div>
      {!repair && (
        <ol
          className="onboarding-dots"
          aria-label={`Step ${STEPS.indexOf(step) + 1} of ${STEPS.length}`}
        >
          {STEPS.map((each) => (
            <li key={each} className={each === step ? 'current' : ''} />
          ))}
        </ol>
      )}
    </main>
  )
}
