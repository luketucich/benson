import { noteName, type NoteDraft } from '../../noteDraft'
import type { Turn } from '../../recording'

// Words the app shows, kept in one place so the main window, the sidebar and
// the panel always match. Benson keeps it short, like a text message.

// Benson's message for a reply: its question, what it's about to do, or what it did.
export function replyText(turn: Extract<Turn, { role: 'benson' }>): string {
  const { draft, outcome } = turn
  if (draft.action === 'clarify') return draft.explanation
  if (outcome === 'saved') return savedText(draft)
  if (outcome === 'discarded') return 'Okay, I won’t save it.'
  return draft.action === 'append'
    ? `I’ll add this to ${noteName(draft.path)}.`
    : `I’ll start a new note, ${noteName(draft.path)}.`
}

// "Added to Groceries." or "Created Groceries."
export function savedText(draft: NoteDraft): string {
  return `${draft.action === 'append' ? 'Added to' : 'Created'} ${noteName(draft.path)}.`
}

export function canSave(draft: NoteDraft): boolean {
  return draft.action !== 'clarify' && Boolean(draft.path.trim() && draft.content.trim())
}

// The words under a voice memo, or why there aren't any.
export function memoText(transcript: string | null): string {
  if (transcript === null) return 'No transcript yet'
  return transcript.trim() || 'No words heard'
}

// Seconds as m:ss, like 1:05.
export function clock(seconds: number): string {
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}
