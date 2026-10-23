import type { ShortcutState } from '../../../shortcut'
import { Alert, Status } from './Message'

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
    <section aria-label="Recording shortcut" className="shortcut-settings">
      <div className="shortcut-controls">
        <strong>Shortcut</strong>
        <Status>{state.listening ? 'Press keys...' : state.label}</Status>
        <button disabled={disabled} onClick={onChange}>
          {buttonText}
        </button>
      </div>
      <p className="shortcut-help">
        {state.listening
          ? 'Press a shortcut. Esc cancels.'
          : 'Hold to record from any app. Release to finish.'}
      </p>
      {state.error && <Alert>{state.error}</Alert>}
    </section>
  )
}
