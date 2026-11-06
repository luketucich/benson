import type { NoteDraft } from '../../../noteDraft'

interface Props {
  draft: NoteDraft
  disabled: boolean
  canSend: boolean
  onChange: (draft: NoteDraft) => void
  onSend: () => void
  onCancel: () => void
}

export function DraftReview({
  draft,
  disabled,
  canSend,
  onChange,
  onSend,
  onCancel
}: Props): React.JSX.Element {
  const clarify = draft.action === 'clarify'
  const action = draft.action === 'create' ? 'New note' : 'Add to note'

  return (
    <section className="draft" aria-labelledby="draft-heading">
      <h2 id="draft-heading" className="meta">
        {clarify ? draft.category : `${action} · ${draft.category}`}
      </h2>
      <p className="draft-explanation">{draft.explanation}</p>

      {/* The editable fields appear only when Qwen picked a note to write to. */}
      {clarify ? (
        <p className="draft-explanation">Record again and say a bit more about where it goes.</p>
      ) : (
        <>
          <label htmlFor="note-path">Save to</label>
          <input
            id="note-path"
            value={draft.path}
            disabled={disabled}
            onChange={(event) => onChange({ ...draft, path: event.target.value })}
          />
          <label htmlFor="note-content">Note</label>
          <textarea
            id="note-content"
            rows={6}
            value={draft.content}
            disabled={disabled}
            onChange={(event) => onChange({ ...draft, content: event.target.value })}
          />
        </>
      )}

      <div className="draft-actions">
        <button className="button-ghost" disabled={disabled} onClick={onCancel}>
          Discard
        </button>
        {!clarify && (
          <button className="button-primary" disabled={!canSend} onClick={onSend}>
            Save to Obsidian
          </button>
        )}
      </div>
    </section>
  )
}
