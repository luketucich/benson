export interface RecordingShortcut {
  code: string
  control: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

export interface ShortcutState {
  label: string
  listening: boolean
  saving: boolean
  error: string | null
}

// What both sides show before a shortcut is picked.
export const unsetShortcut: ShortcutState = {
  label: 'Not set',
  listening: false,
  saving: false,
  error: null
}

export const recordingActivities = ['idle', 'starting', 'recording', 'processing'] as const
export type RecordingActivity = (typeof recordingActivities)[number]
