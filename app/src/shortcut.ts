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

export type RecordingActivity = 'idle' | 'starting' | 'recording' | 'processing'
