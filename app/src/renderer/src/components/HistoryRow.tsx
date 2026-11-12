import type { SavedRecording } from '../../../recording'
import { memoText } from '../draftText'
import { MoreIcon } from './icons'

interface Props {
  recording: SavedRecording
  selected: boolean
  removing: boolean
  disabled: boolean
  onOpen: () => void
  onMenu: () => void
}

// One recording in the sidebar: what you said, when, and a "..." menu.
export function HistoryRow({
  recording,
  selected,
  removing,
  disabled,
  onOpen,
  onMenu
}: Props): React.JSX.Element {
  const title = recording.transcript?.trim()
  const time = new Date(recording.created_at).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })

  return (
    <li
      className={removing ? 'history-row removing' : 'history-row'}
      onContextMenu={(event) => {
        event.preventDefault()
        onMenu()
      }}
    >
      <button className="history-item" disabled={disabled} aria-pressed={selected} onClick={onOpen}>
        <span className={title ? 'history-title' : 'history-title empty-title'}>
          {title || memoText(recording.transcript)}
        </span>
        <span className="meta">
          {time}
          {recording.sent_at && <span className="sent-tag"> · Saved</span>}
        </span>
      </button>
      <button
        className="icon-button history-more"
        aria-label="More options"
        disabled={disabled}
        onClick={onMenu}
      >
        <MoreIcon />
      </button>
    </li>
  )
}
