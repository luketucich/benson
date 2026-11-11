import { useState } from 'react'
import type { NoteDraft } from '../../../noteDraft'
import { noteName } from '../../../noteDraft'
import { canSave } from '../draftText'
import { CheckIcon, FolderIcon, TrashIcon } from './icons'
import { FieldRow, FieldValue } from './FieldRow'
import { useToast } from '../toast'

interface Props {
  draft: NoteDraft
  busy: boolean
  onSave: (draft: NoteDraft) => void
  onDiscard: () => void
  // Hears each change you make, so the panel can hand your edits to the window.
  onEdit?: (draft: NoteDraft) => void
}

// The note Benson wrote, attached to its reply. Before saving, you can pick
// another note to add it to, or a new name, with Choose File..., and change
// what it says.
export function DraftReview({
  draft: written,
  busy,
  onSave,
  onDiscard,
  onEdit
}: Props): React.JSX.Element {
  const [draft, setDraft] = useState(written)
  const toast = useToast()
  const ready = !busy && canSave(draft)
  const folder = draft.path.split('/').slice(0, -1).join('/')

  function change(next: NoteDraft): void {
    setDraft(next)
    onEdit?.(next)
  }

  // Asks whether to add to a note or make a new one, then opens the Mac's
  // file picker in your vault.
  async function chooseFile(): Promise<void> {
    try {
      const choice = await window.api.chooseNote(draft.path)
      if (choice) change({ ...draft, ...choice })
    } catch {
      toast('Choose a note inside your vault.', 'error')
    }
  }

  // It's a form, so Enter saves. In the note itself, Command-Enter saves,
  // since Enter starts a new line.
  function save(event?: React.FormEvent): void {
    event?.preventDefault()
    if (ready) onSave(draft)
  }

  return (
    <form className="draft" aria-label="Note to save" onSubmit={save}>
      <FieldRow
        button="Choose File..."
        icon={FolderIcon}
        disabled={busy}
        onClick={() => void chooseFile()}
      >
        {/* The note's name comes first, so a long folder never hides it. */}
        <FieldValue title={draft.path}>
          {noteName(draft.path)}
          {folder && <span className="field-hint"> in {folder}</span>}
        </FieldValue>
      </FieldRow>
      <textarea
        aria-label="Note"
        rows={5}
        value={draft.content}
        disabled={busy}
        onChange={(event) => change({ ...draft, content: event.target.value })}
        onKeyDown={(event) => event.key === 'Enter' && event.metaKey && save(event)}
      />

      <div className="draft-actions">
        <button type="button" className="button-ghost" disabled={busy} onClick={onDiscard}>
          <TrashIcon />
          Discard
        </button>
        <button
          type="submit"
          className="button-primary"
          title="Save to Obsidian (⌘↩)"
          disabled={!ready}
        >
          <CheckIcon />
          Save to Obsidian
        </button>
      </div>
    </form>
  )
}
