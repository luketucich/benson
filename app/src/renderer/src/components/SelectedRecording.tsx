interface Props {
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
  audioUrl,
  transcript,
  busy,
  showPrepare,
  prepareLabel,
  prepareDisabled,
  onPrepare,
  children
}: Props): React.JSX.Element {
  return (
    <section aria-label="Selected recording">
      {audioUrl && <audio controls src={audioUrl} aria-label="Recording playback" />}
      <h2>Transcript</h2>
      {transcript ? <p className="transcript">{transcript}</p> : !busy && <p>No transcript yet.</p>}
      {showPrepare && (
        <button disabled={prepareDisabled} onClick={onPrepare}>
          {prepareLabel}
        </button>
      )}
      {children}
    </section>
  )
}
