import { useEffect, useState } from 'react'

// Shown while the microphone is on, so it's obvious Benson is listening.
export function RecordingView({ fromShortcut }: { fromShortcut: boolean }): React.JSX.Element {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250)
    return () => clearInterval(timer)
  }, [])

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <section className="recording-view" aria-label="Recording">
      <div className="pulse" aria-hidden="true">
        <span />
      </div>
      <h2>Listening...</h2>
      <p className="timer" role="timer">
        {time}
      </p>
      <p className="meta">
        {fromShortcut
          ? 'Let go of your shortcut when you’re done.'
          : 'Press Stop when you’re done.'}
      </p>
    </section>
  )
}
