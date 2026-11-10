export interface RecordingShortcut {
  code: string
  control: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

// The shortcut onboarding offers to anyone who doesn't have one yet.
export const suggestedShortcut: RecordingShortcut = {
  code: 'Space',
  control: true,
  alt: true,
  shift: false,
  meta: false
}

export interface ShortcutState {
  label: string
  listening: boolean
  // While setting a shortcut: the keys being held right now, like "Control + Option".
  pressing: string
  saving: boolean
  error: string | null
}

// Before a shortcut is picked. An empty label means there isn't one.
export const unsetShortcut: ShortcutState = {
  label: '',
  listening: false,
  pressing: '',
  saving: false,
  error: null
}

// The keys to show: the ones being held while you set a shortcut, otherwise
// the saved shortcut ('' when there isn't one).
export function shownKeys(state: ShortcutState): string {
  return state.listening ? state.pressing : state.label
}

export const recordingActivities = ['idle', 'starting', 'recording', 'processing'] as const
export type RecordingActivity = (typeof recordingActivities)[number]
