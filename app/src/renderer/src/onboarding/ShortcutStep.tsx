import { shownKeys } from '../../../shortcut'
import type { ShortcutControls } from '../hooks/useShortcut'
import { Keys } from '../components/Keys'
import { Screen } from './Screen'

// The keys you hold to talk to Benson. They show as key caps while you press
// them, the same as in Settings. Someone without one gets a ready-made choice.
export function ShortcutStep({
  shortcut: { state, changing, buttonText, change },
  onNext
}: {
  shortcut: ShortcutControls
  onNext: () => void
}): React.JSX.Element {
  const set = Boolean(state.label)
  const shown = shownKeys(state)

  return (
    <Screen
      visual={shown ? <Keys label={shown} /> : <span className="field-hint">Press your keys</span>}
      title="Your shortcut"
      description="Hold it in any app to talk to Benson, and let go when you’re done. Pick something easy to reach."
    >
      {set || changing ? (
        <button className="button-primary onboarding-main" disabled={changing} onClick={onNext}>
          Next
        </button>
      ) : (
        <button
          className="button-primary onboarding-main"
          onClick={() => void window.api.useSuggestedShortcut()}
        >
          Use Control + Option + Space
        </button>
      )}
      <button className="button-ghost" disabled={state.saving} onClick={() => void change()}>
        {set && !changing ? 'Change shortcut' : buttonText}
      </button>
    </Screen>
  )
}
