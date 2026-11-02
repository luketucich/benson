import type { ShortcutState } from '../../../shortcut'
import { Alert } from './Message'

interface Props {
  state: ShortcutState
  buttonText: string
  disabled: boolean
  onChange: () => void
}

export function ShortcutSettings({
  state,
  buttonText,
  disabled,
  onChange
}: Props): React.JSX.Element {
  return (
    <section aria-label="Recording shortcut">
      <div className="shortcut-row">
        <span className="shortcut-keys" role="status">
          {state.listening ? 'Press keys...' : state.label}
        </span>
        <button disabled={disabled} onClick={onChange}>
          {buttonText}
        </button>
      </div>
      <p className="shortcut-help">
        {state.listening ? 'Esc cancels.' : 'Hold to record from any app.'}
      </p>
      {state.error && <Alert>{state.error}</Alert>}
    </section>
  )
}
