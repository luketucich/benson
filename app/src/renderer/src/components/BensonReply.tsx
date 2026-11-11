import type { NoteDraft } from '../../../noteDraft'
import type { Turn } from '../../../recording'
import { replyText } from '../draftText'
import { Bubble } from './Bubble'
import { DraftReview } from './DraftReview'

interface Props {
  turn: Extract<Turn, { role: 'benson' }>
  // Only Benson's latest reply can still be saved or discarded.
  latest: boolean
  busy?: boolean
  justSaved?: boolean
  onSave: (draft: NoteDraft) => void
  onDiscard: () => void
  // The note as you changed it in the panel, so the window picks up where you were.
  edited?: NoteDraft | null
  onEdit?: (draft: NoteDraft) => void
  // True when the reply was already there when the thread opened.
  still?: boolean
}

// One reply from Benson: a short message, with the note to check attached when
// there is one. The main window and the floating panel both show this.
export function BensonReply({
  turn,
  latest,
  busy = false,
  justSaved = false,
  onSave,
  onDiscard,
  edited,
  onEdit,
  still
}: Props): React.JSX.Element {
  const { draft, outcome } = turn
  const showNote = latest && !outcome && draft.action !== 'clarify'
  const start = edited ?? draft

  return (
    <>
      <Bubble from="benson" still={still} className={latest && justSaved ? 'just-saved' : ''}>
        <p className="bubble-text">{replyText(turn)}</p>
      </Bubble>

      {showNote && (
        // Keyed by the draft, so a new draft (or edits from the panel) starts fresh.
        <Bubble from="benson" still={still} className="bubble-card">
          <DraftReview
            key={JSON.stringify(start)}
            draft={start}
            busy={busy}
            onSave={onSave}
            onDiscard={onDiscard}
            onEdit={onEdit}
          />
        </Bubble>
      )}
    </>
  )
}
