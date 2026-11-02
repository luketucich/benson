import type { SavedRecording } from '../../../recording'
import { Alert, Status } from './Message'

interface Props {
  items: SavedRecording[]
  loading: boolean
  error: string | null
  disabled: boolean
  selectedPath: string | null
  onOpen: (recording: SavedRecording) => void
  onRetry: () => void
}

// "Today", "Yesterday", or a short date, so the list reads like a notebook.
function dayLabel(date: Date): string {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupByDay(items: SavedRecording[]): [string, SavedRecording[]][] {
  const groups = new Map<string, SavedRecording[]>()
  for (const item of items) {
    const label = dayLabel(new Date(item.created_at))
    groups.set(label, [...(groups.get(label) ?? []), item])
  }
  return [...groups]
}

export function HistoryList({
  items,
  loading,
  error,
  disabled,
  selectedPath,
  onOpen,
  onRetry
}: Props): React.JSX.Element {
  return (
    <nav className="history" aria-label="Recordings">
      {loading && <Status>Loading recordings...</Status>}
      {error && (
        <div className="history-note">
          <Alert>{error}</Alert>
          <button disabled={disabled} onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="history-note">Your recordings will appear here.</p>
      )}
      {groupByDay(items).map(([label, group]) => (
        <section key={label} aria-label={label}>
          <h2>{label}</h2>
          <ul>
            {group.map((item) => (
              <li key={item.id}>
                <button
                  className="history-item"
                  disabled={disabled}
                  aria-pressed={selectedPath === item.audio_path}
                  onClick={() => onOpen(item)}
                >
                  <span className="history-title">
                    {item.transcript?.trim() || 'No transcript yet'}
                  </span>
                  <span className="meta">
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                    {item.sent_at && <span className="sent-tag"> · Sent</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
