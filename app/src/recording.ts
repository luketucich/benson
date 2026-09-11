// The fields stored for each recording.
export type SavedRecording = {
  id: number
  created_at: string
  audio_path: string
  transcript: string | null
}
