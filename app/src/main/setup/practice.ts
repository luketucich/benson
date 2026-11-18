import type { NoteDraft } from '../../noteDraft'

// The note onboarding's practice runs are saved into.
export const PRACTICE_NOTE = 'Welcome to Benson.md'

// During onboarding, every note goes into Welcome to Benson: the first one
// starts it and the second adds to it. A question from Benson stays as it is.
export function practiceDraft(draft: NoteDraft, exists: boolean): NoteDraft {
  if (draft.action === 'clarify') return draft
  return { ...draft, path: PRACTICE_NOTE, action: exists ? 'append' : 'create' }
}
