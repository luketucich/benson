import type { NoteDraft } from '../../../noteDraft'

interface Props {
  draft: NoteDraft
  disabled: boolean
  canSend: boolean
  onChange: (draft: NoteDraft) => void
  onSend: () => void
  onCancel: () => void
}

// The editable half of a draft. Shown only when Qwen picked a note to write to.
function DraftFields({
  draft,
  disabled,
  canSend,
  onChange,
  onSend
}: Omit<Props, 'onCancel'>): React.JSX.Element {
  return (
    <>
      <p>Action: {draft.action === 'create' ? 'Create a new note' : 'Append to a note'}</p>
      <label htmlFor="note-path">Destination</label>
      <input
        id="note-path"
        value={draft.path}
        disabled={disabled}
        onChange={(event) => onChange({ ...draft, path: event.target.value })}
      />
      <label htmlFor="note-content">Note text</label>
      <textarea
        id="note-content"
        rows={6}
        value={draft.content}
        disabled={disabled}
        onChange={(event) => onChange({ ...draft, content: event.target.value })}
      />
      <button disabled={!canSend} onClick={onSend}>
        Send
      </button>{' '}
    </>
  )
}

export function DraftReview({ draft, onCancel, ...fields }: Props): React.JSX.Element {
  return (
    <section aria-labelledby="draft-heading">
      <h2 id="draft-heading">Review note</h2>
      <p>Category: {draft.category}</p>
      <p>{draft.explanation}</p>
      {draft.action === 'clarify' ? (
        <p>Add more detail to your instructions, then prepare another draft.</p>
      ) : (
        <DraftFields draft={draft} {...fields} />
      )}
      <button disabled={fields.disabled} onClick={onCancel}>
        Cancel
      </button>
    </section>
  )
}
