import { StopIcon } from './icons'

// The round button that stops Benson while it's working. The reply box and
// the panel both use it, so it looks the same everywhere.
export function StopButton({ onClick }: { onClick: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      className="composer-button composer-send"
      aria-label="Stop Benson"
      title="Stop"
      onClick={onClick}
    >
      <StopIcon />
    </button>
  )
}
