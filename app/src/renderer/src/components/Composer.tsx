import { useState } from 'react'
import { MicIcon, SendIcon, StopIcon } from './icons'
import { StopButton } from './StopButton'

interface Props {
  busy?: boolean
  // True while the microphone is on for a spoken reply.
  listening?: boolean
  onSend: (text: string) => void
  // Starts a spoken reply, or stops it.
  onTalk: () => void
  // Stops Benson while it's working. Null when there's nothing to stop.
  onStop?: (() => void) | null
}

// The reply box under a thread, like iMessage: type a reply and press Enter,
// or tap the mic and say it. While Benson works, the mic becomes Stop.
// The main window and the panel both use this.
export function Composer({
  busy = false,
  listening = false,
  onSend,
  onTalk,
  onStop
}: Props): React.JSX.Element {
  const [text, setText] = useState('')

  function send(event: React.FormEvent): void {
    event.preventDefault()
    if (!text.trim() || busy) return
    onSend(text.trim())
    setText('')
  }

  return (
    <form className="composer" onSubmit={send}>
      <input
        aria-label="Reply to Benson"
        placeholder={listening ? 'Listening...' : 'Reply to Benson'}
        value={text}
        disabled={busy || listening}
        onChange={(event) => setText(event.target.value)}
      />
      {onStop && !listening ? (
        <StopButton onClick={onStop} />
      ) : text.trim() && !listening ? (
        <button
          type="submit"
          className="composer-button composer-send"
          aria-label="Send"
          disabled={busy}
        >
          <SendIcon />
        </button>
      ) : (
        <button
          type="button"
          className={listening ? 'composer-button composer-stop' : 'composer-button'}
          aria-label={listening ? 'Stop' : 'Say a reply'}
          disabled={busy && !listening}
          onClick={onTalk}
        >
          {listening ? <StopIcon /> : <MicIcon />}
        </button>
      )}
    </form>
  )
}
