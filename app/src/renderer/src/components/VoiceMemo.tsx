import { useRef, useState } from 'react'
import { useClip } from '../hooks/useClip'
import { playThroughSpeaker } from '../speaker'
import { clock } from '../draftText'
import { PauseIcon, PlayIcon } from './icons'

// "1:05" from 65 seconds.
// A recording shown like a voice memo in a text thread: a play button, its
// waveform, and how long it is. Drag across the waveform to jump around.
export function VoiceMemo({ path }: { path: string }): React.JSX.Element {
  const { url, bars, duration, failed } = useClip(path)
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)

  function toggle(): void {
    const element = audio.current
    if (!element) return
    if (element.paused) {
      playThroughSpeaker(element)
      void element.play()
    } else {
      element.pause()
    }
  }

  if (failed) return <p className="memo-missing">Audio not found. It may have been moved.</p>

  const played = duration ? time / duration : 0

  return (
    <div className="memo">
      {url && (
        <audio
          ref={audio}
          src={url}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setTime(0)}
        />
      )}
      <button
        className="memo-play"
        aria-label={playing ? 'Pause recording' : 'Play recording'}
        disabled={!url}
        onClick={toggle}
      >
        {/* Keyed so the icon swap fades instead of snapping. */}
        <span key={playing ? 'pause' : 'play'} className="memo-icon">
          {playing ? <PauseIcon /> : <PlayIcon />}
        </span>
      </button>

      <div className="memo-wave">
        {bars.map((height, index) => (
          <span
            key={index}
            className={index / bars.length < played ? 'memo-bar played' : 'memo-bar'}
            style={{ height: `${height * 100}%` }}
          />
        ))}
        {/* An invisible slider on top of the bars, for dragging and the keyboard. */}
        <input
          type="range"
          aria-label="Position in recording"
          min={0}
          max={duration || 1}
          step={0.01}
          value={time}
          disabled={!duration}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (audio.current) audio.current.currentTime = next
            setTime(next)
          }}
        />
      </div>

      <span className="memo-time">{clock(playing || time ? time : duration)}</span>
    </div>
  )
}
