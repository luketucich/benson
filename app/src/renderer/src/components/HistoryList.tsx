import { useMemo, useState } from 'react'
import type { SavedRecording } from '../../../recording'
import { HistoryRow } from './HistoryRow'
import { RetryIcon } from './icons'
import { Alert, Status } from './Message'

interface Props {
  items: SavedRecording[]
  loading: boolean
  error: string | null
  disabled: boolean
  selectedId: number | null
  onOpen: (recording: SavedRecording) => void
  onDelete: (recording: SavedRecording) => Promise<void>
  onRetry: () => void
}

// How long a deleted row takes to fold away (fold-away in sidebar.css).
const FOLD_MS = 220

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
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(item)
  }
  return [...groups]
}

export function HistoryList({
  items,
  loading,
  error,
  disabled,
  selectedId,
  onOpen,
  onDelete,
  onRetry
}: Props): React.JSX.Element {
  // Only regrouped when the recordings change, not on every redraw.
  const days = useMemo(() => groupByDay(items), [items])
  const [removing, setRemoving] = useState<number | null>(null)

  // The "..." menu, from the button or a right-click. A deleted row folds
  // away first, and stays folded until the list reloads without it.
  async function showMenu(recording: SavedRecording): Promise<void> {
    if (disabled) return
    if ((await window.api.showRecordingMenu()) !== 'delete') return
    setRemoving(recording.id)
    await new Promise((resolve) => setTimeout(resolve, FOLD_MS))
    await onDelete(recording)
    setRemoving(null)
  }

  return (
    <nav className="history" aria-label="Recordings">
      {loading && <Status>Loading recordings...</Status>}
      {error && (
        <div className="history-note">
          <Alert>{error}</Alert>
          <button disabled={disabled} onClick={onRetry}>
            <RetryIcon />
            Try again
          </button>
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="history-note">Your recordings will appear here.</p>
      )}
      {days.map(([label, group]) => (
        <section key={label} aria-label={label}>
          <h2>{label}</h2>
          <ul>
            {group.map((recording) => (
              <HistoryRow
                key={recording.id}
                recording={recording}
                selected={recording.id === selectedId}
                removing={recording.id === removing}
                disabled={disabled}
                onOpen={() => onOpen(recording)}
                onMenu={() => void showMenu(recording)}
              />
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
