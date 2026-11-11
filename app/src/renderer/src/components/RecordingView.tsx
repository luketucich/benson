import { useEffect, useState } from 'react'
import { clock } from '../draftText'

// Shown while the microphone is on, so it's obvious Benson is listening.
export function RecordingView({ fromShortcut }: { fromShortcut: boolean }): React.JSX.Element {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="recording-view" aria-label="Recording">
      <div className="pulse" aria-hidden="true">
        <span />
      </div>
      <h2>Listening...</h2>
      <p className="timer" role="timer">
        {clock(seconds)}
      </p>
      <p className="meta">
        {fromShortcut
          ? 'Let go of your shortcut when you’re done.'
          : 'Press Stop when you’re done.'}
      </p>
    </section>
  )
}
