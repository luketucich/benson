import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { NoteDraft } from '../../../noteDraft'
import type { SavedRecording } from '../../../recording'
import { BensonReply } from './BensonReply'
import { memoText } from '../draftText'
import { Bubble } from './Bubble'
import { Composer } from './Composer'
import { VoiceMemo } from './VoiceMemo'
import { PlayIcon } from './icons'

interface Props {
  recording: SavedRecording
  // What Benson is doing right now. While it's set, Benson shows typing dots.
  step: string
  busy: boolean
  // True while the microphone is on for a spoken reply.
  listening: boolean
  justSaved: boolean
  // The note as you changed it in the floating panel, if you did.
  panelEdit: NoteDraft | null
  onSave: (draft: NoteDraft) => void
  onDiscard: () => void
  onReply: (text: string) => void
  onTalk: () => void
  // Carries on from the step that failed or was stopped: transcribing, or
  // Benson's answer.
  onRetry: () => void
  // Stops Benson's work. Null when there's nothing to stop.
  onStop: (() => void) | null
}

// A recording as a text thread: your voice memo on the right, Benson's
// replies on the left, your replies in between, and a reply box at the bottom.
export function Conversation({
  recording,
  step,
  busy,
  listening,
  justSaved,
  panelEdit,
  onSave,
  onDiscard,
  onReply,
  onTalk,
  onRetry,
  onStop
}: Props): React.JSX.Element {
  const turns = recording.conversation
  const end = useRef<HTMLDivElement>(null)
  const opened = useRef(false)
  // How many messages were there when the thread opened. Those don't ease in.
  const [turnsAtOpen] = useState(turns.length)

  // Like a messaging app, keep the newest message in view as the thread grows.
  // Opening a thread starts there right away instead of scrolling down to it.
  useLayoutEffect(() => {
    end.current?.scrollIntoView({ block: 'end', behavior: opened.current ? 'smooth' : 'instant' })
    opened.current = true
  }, [turns.length, step])

  // Resizing the window keeps it there too, so the reply box never covers the note.
  useEffect(() => {
    const keepNewestInView = (): void => end.current?.scrollIntoView({ block: 'end' })
    window.addEventListener('resize', keepNewestInView)
    return () => window.removeEventListener('resize', keepNewestInView)
  }, [])
  const when = new Date(recording.created_at).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
  // You can keep talking to Benson until the note is saved.
  const canReply = Boolean(recording.transcript?.trim()) && !recording.sent_at
  // Benson owes you an answer but isn't working on one: it failed, or the
  // recording was never transcribed.
  const last = turns.at(-1)
  const unanswered = !recording.sent_at && !step && !busy && (!last || last.role === 'you')
  // Transcribed, but there were no words in it. Trying again won't help.
  const heardNothing = recording.transcript !== null && !recording.transcript.trim()

  return (
    <section className="thread" aria-label={`Recording from ${when}`}>
      <p className="thread-time">{when}</p>

      <VoiceBubble path={recording.audio_path} text={memoText(recording.transcript)} still />

      {/* Notes saved before Benson kept conversations only say that they were saved. */}
      {recording.sent_at && !turns.length && (
        <Bubble from="benson">
          <p className="bubble-text">Saved to Obsidian.</p>
        </Bubble>
      )}

      {turns.map((turn, index) =>
        turn.role === 'you' ? (
          // A spoken reply plays back like your first voice memo, with its words under it.
          turn.audio_path ? (
            <VoiceBubble
              key={index}
              path={turn.audio_path}
              text={turn.text}
              still={index < turnsAtOpen}
            />
          ) : (
            <Bubble key={index} from="you" still={index < turnsAtOpen}>
              <p className="bubble-text">{turn.text}</p>
            </Bubble>
          )
        ) : (
          <BensonReply
            key={index}
            turn={turn}
            latest={index === turns.length - 1}
            still={index < turnsAtOpen}
            edited={index === turns.length - 1 ? panelEdit : null}
            busy={busy}
            justSaved={justSaved}
            onSave={onSave}
            onDiscard={onDiscard}
          />
        )
      )}

      {step && (
        <Bubble from="benson" className="typing-dots">
          <span />
          <span />
          <span />
          <span className="sr-only" role="status">
            {step}
          </span>
        </Bubble>
      )}

      {unanswered &&
        (heardNothing ? (
          <Bubble from="benson">
            <p className="bubble-text">I didn’t hear anything in that one.</p>
          </Bubble>
        ) : (
          <Bubble from="benson">
            <p className="bubble-text">I didn’t get to answer that.</p>
            <button className="bubble-action" onClick={onRetry}>
              <PlayIcon />
              Continue
            </button>
          </Bubble>
        ))}

      {/* While Benson works, the reply box stays so its Stop button is there. */}
      {(canReply || onStop) && (
        <Composer
          busy={busy}
          listening={listening}
          onSend={onReply}
          onTalk={onTalk}
          onStop={onStop}
        />
      )}
      <div ref={end} />
    </section>
  )
}

// Something you said out loud: a voice memo you can play, with its words under it.
function VoiceBubble({
  path,
  text,
  still
}: {
  path: string
  text: string
  still: boolean
}): React.JSX.Element {
  return (
    <Bubble from="you" still={still} className="bubble-memo">
      <VoiceMemo path={path} />
      <p className="memo-transcript">{text}</p>
    </Bubble>
  )
}
