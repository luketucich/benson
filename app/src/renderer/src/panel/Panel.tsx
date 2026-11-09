import { useEffect, useLayoutEffect, useRef } from 'react'
import type { NoteDraft } from '../../../noteDraft'
import type { PanelStatus } from '../../../panel'
import { BensonReply } from '../components/BensonReply'
import { Bubble } from '../components/Bubble'
import { Composer } from '../components/Composer'
import { CloseIcon, OpenIcon } from '../components/icons'
import { PanelProgress } from './PanelProgress'
import { usePanelStatus } from './usePanelStatus'

// How long a finished message stays before the panel tucks itself away.
// Problems stay a little longer, so there's time to read them, and Stopped
// leaves time to press Continue.
const SHOW_MS: Partial<Record<PanelStatus['kind'], number>> = {
  sent: 1800,
  error: 5000,
  stopped: 6000
}

// The floating panel. It shows what the main window tells it, and its buttons
// are handed back to the main window, which does the actual work.
function Panel(): React.JSX.Element | null {
  const { status, leaving, round } = usePanelStatus()
  const card = useRef<HTMLDivElement>(null)

  // Finished messages only need a moment.
  useEffect(() => {
    const showFor = status && SHOW_MS[status.kind]
    if (!showFor || leaving) return
    const timer = setTimeout(() => window.api.closePanel(), showFor)
    return () => clearTimeout(timer)
  }, [status, leaving])

  // The window is sized to fit the card, whatever it's showing.
  useLayoutEffect(() => {
    const element = card.current
    if (!element) return
    const observer = new ResizeObserver(() => window.api.resizePanel(element.offsetHeight))
    observer.observe(element)
    return () => observer.disconnect()
  }, [status?.kind, round])

  if (!status) return null

  return (
    <div
      key={round}
      ref={card}
      className={leaving ? `panel panel-${status.kind} panel-leave` : `panel panel-${status.kind}`}
    >
      {status.kind === 'review' ? (
        <PanelReview key={JSON.stringify(status.draft)} draft={status.draft} said={status.said} />
      ) : (
        <PanelProgress status={status} />
      )}
    </div>
  )
}

// Benson's reply and the reply box, shown exactly as they are in the main window.
function PanelReview({ draft, said }: { draft: NoteDraft; said: string }): React.JSX.Element {
  const reply = useRef<HTMLElement>(null)

  useEffect(() => {
    // The panel takes typing for a review, so start in the first field: the
    // note's text, or the reply box when Benson asked a question.
    reply.current?.querySelector<HTMLElement>('textarea, input')?.focus()

    // Esc closes the panel. The note stays in Benson for later.
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') window.api.closePanel()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  return (
    <section ref={reply} className="panel-review">
      <header className="panel-bar">
        <p className="panel-title">Benson</p>
        <button className="button-ghost" onClick={() => window.api.openFromPanel()}>
          <OpenIcon />
          Open
        </button>
        <button
          className="icon-button"
          aria-label="Close"
          title="Close (Esc)"
          onClick={() => window.api.closePanel()}
        >
          <CloseIcon />
        </button>
      </header>

      <div className="thread">
        {/* What you said, so Benson's reply makes sense on its own. */}
        {said && (
          <Bubble from="you" className="panel-said">
            <p className="bubble-text" title={said}>
              {said}
            </p>
          </Bubble>
        )}
        <BensonReply
          turn={{ role: 'benson', draft }}
          latest
          onSave={(edited) => window.api.panelAction({ type: 'save', draft: edited })}
          onDiscard={() => window.api.panelAction({ type: 'discard' })}
          onEdit={(edited) => window.api.panelAction({ type: 'edit', draft: edited })}
        />
        <Composer
          onSend={(text) => window.api.panelAction({ type: 'reply', text })}
          onTalk={() => window.api.panelAction({ type: 'talk' })}
        />
      </div>
    </section>
  )
}

export default Panel
