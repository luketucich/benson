interface Props {
  createdAt: string | null
  audioUrl: string | null
  transcript: string | null
  busy: boolean
  showPrepare: boolean
  prepareLabel: string
  prepareDisabled: boolean
  onPrepare: () => void
  children?: React.ReactNode
}

export function SelectedRecording({
  createdAt,
  audioUrl,
  transcript,
  busy,
  showPrepare,
  prepareLabel,
  prepareDisabled,
  onPrepare,
  children
}: Props): React.JSX.Element {
  const when = createdAt ? new Date(createdAt) : new Date()
  return (
    <section className="selected" aria-labelledby="recording-title">
      <h1 id="recording-title" className="recording-title">
        {when.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
      </h1>
      {audioUrl && <audio controls src={audioUrl} aria-label="Recording playback" />}
      {transcript ? (
        <p className="transcript">{transcript}</p>
      ) : (
        !busy && <p className="transcript">No transcript yet.</p>
      )}
      {showPrepare && (
        <p>
          <button className="button-primary" disabled={prepareDisabled} onClick={onPrepare}>
            {prepareLabel}
          </button>
        </p>
      )}
      {children}
    </section>
  )
}
