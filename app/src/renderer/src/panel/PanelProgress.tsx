import type { PanelStatus } from '../../../panel'
import { savedText } from '../draftText'
import { CheckIcon, OpenIcon, PlayIcon, StopIcon } from '../components/icons'
import { StopButton } from '../components/StopButton'

type Progress = Exclude<PanelStatus, { kind: 'review' }>

// One line telling you what's happening: listening, working, saved, stopped,
// or a problem.
export function PanelProgress({ status }: { status: Progress }): React.JSX.Element {
  return (
    <div className="panel-row" role={status.kind === 'error' ? 'alert' : 'status'}>
      <span className={`panel-symbol panel-${status.kind}-symbol`} aria-hidden="true">
        {status.kind === 'sent' && <CheckIcon />}
        {status.kind === 'error' && '!'}
      </span>
      <p className="panel-text">{headline(status)}</p>
      {status.kind === 'recording' && !status.held && (
        <button
          className="composer-button composer-stop"
          aria-label="Stop recording"
          title="Stop"
          onClick={() => window.api.panelAction({ type: 'stop-recording' })}
        >
          <StopIcon />
        </button>
      )}
      {status.kind === 'working' && status.canStop && (
        <StopButton onClick={() => window.api.panelAction({ type: 'stop-work' })} />
      )}
      {status.kind === 'stopped' && (
        <button onClick={() => window.api.panelAction({ type: 'continue' })}>
          <PlayIcon />
          Continue
        </button>
      )}
      {status.kind === 'error' && (
        <button onClick={() => window.api.openFromPanel()}>
          <OpenIcon />
          Open
        </button>
      )}
    </div>
  )
}

function headline(status: Progress): string {
  if (status.kind === 'recording') return 'Listening...'
  if (status.kind === 'sent') return savedText(status.draft)
  if (status.kind === 'stopped') return 'Stopped.'
  return status.text
}
