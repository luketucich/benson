// The pieces Benson downloads to work, and how each is doing. Shared by the
// main process (which checks and installs them) and the onboarding screens.

export type PieceId = 'uv' | 'ffmpeg' | 'ollama' | 'qwen' | 'speech'

export interface PieceStatus {
  id: PieceId
  name: string
  state: 'ready' | 'missing' | 'installing' | 'failed'
  // Bytes so far and in total, while it downloads.
  done?: number
  total?: number
  // What went wrong, in one plain sentence.
  error?: string
}

export interface SetupState {
  // True until onboarding has been finished once.
  onboarding: boolean
  pieces: PieceStatus[]
}
