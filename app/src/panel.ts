import { validateDraft, type NoteDraft } from './noteDraft'

// What the floating panel shows. While recording, "held" means the shortcut
// is being held down, so the panel doesn't need a Stop button.
export type PanelStatus =
  | { kind: 'recording'; held: boolean }
  // canStop is false for steps too quick or risky to stop, like saving.
  | { kind: 'working'; text: string; canStop: boolean }
  // Benson's reply, under the last thing you said to it.
  | { kind: 'review'; draft: NoteDraft; said: string }
  | { kind: 'sent'; draft: NoteDraft }
  | { kind: 'error'; text: string }
  // You stopped Benson partway. Continue picks up where it left off.
  | { kind: 'stopped' }

// What you can do from the panel. The main window carries it out.
export type PanelAction =
  | { type: 'save'; draft: NoteDraft }
  // A change to the note, so the main window keeps it if the panel closes.
  | { type: 'edit'; draft: NoteDraft }
  | { type: 'discard' }
  | { type: 'reply'; text: string }
  | { type: 'talk' }
  | { type: 'stop-recording' }
  // Stop Benson's work, or pick it up again after stopping.
  | { type: 'stop-work' }
  | { type: 'continue' }

// Checks a status that came over IPC before main acts on it.
export function isPanelStatus(value: unknown): value is PanelStatus {
  if (!value || typeof value !== 'object') return false
  const status = value as Record<string, unknown>
  switch (status.kind) {
    case 'recording':
      return typeof status.held === 'boolean'
    case 'working':
      return typeof status.text === 'string' && typeof status.canStop === 'boolean'
    case 'error':
      return typeof status.text === 'string'
    case 'review':
      return isDraft(status.draft) && typeof status.said === 'string'
    case 'sent':
      return isDraft(status.draft)
    case 'stopped':
      return true
    default:
      return false
  }
}

export function isPanelAction(value: unknown): value is PanelAction {
  if (!value || typeof value !== 'object') return false
  const action = value as Record<string, unknown>
  if (action.type === 'save' || action.type === 'edit') return isDraft(action.draft)
  if (action.type === 'reply') return typeof action.text === 'string'
  return ['discard', 'talk', 'stop-recording', 'stop-work', 'continue'].includes(
    String(action.type)
  )
}

function isDraft(value: unknown): boolean {
  try {
    validateDraft(value)
    return true
  } catch {
    return false
  }
}
