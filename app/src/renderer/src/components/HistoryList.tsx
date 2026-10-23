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
    <section aria-labelledby="history-heading">
      <h2 id="history-heading">History</h2>
      {loading && <Status>Loading recordings...</Status>}
      {error && (
        <div>
          <Alert>{error}</Alert>
          <button disabled={disabled} onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && items.length === 0 && <p>Your recordings will appear here.</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              disabled={disabled}
              aria-pressed={selectedPath === item.audio_path}
              onClick={() => onOpen(item)}
            >
              {new Date(item.created_at).toLocaleString()}
            </button>{' '}
            {item.transcript ? item.transcript.slice(0, 100) : 'No transcript yet'}
            {item.sent_at && <p>Sent to Obsidian: {new Date(item.sent_at).toLocaleString()}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
