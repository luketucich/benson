import type { NoteDraft } from './noteDraft'

// One step in the back-and-forth after a recording: Benson's reply, or a reply
// you typed or said. Benson's reply remembers whether the note was saved or
// discarded. A spoken reply keeps its audio.
export type Turn =
  | { role: 'benson'; draft: NoteDraft; outcome?: 'saved' | 'discarded' }
  | { role: 'you'; text: string; audio_path?: string }

// The fields stored for each recording.
export type SavedRecording = {
  id: number
  created_at: string
  audio_path: string
  transcript: string | null
  sent_at: string | null
  conversation: Turn[]
}

// The last thing you said in a recording: your latest reply, or the
// recording itself.
export function lastSaid(recording: SavedRecording): string {
  const yours = recording.conversation.filter((turn) => turn.role === 'you').at(-1)
  return (yours?.text ?? recording.transcript ?? '').trim()
}

// True when Benson's latest reply is a question you haven't answered yet.
export function isWaitingForAnswer(recording: SavedRecording | undefined): boolean {
  const last = recording?.conversation.at(-1)
  return last?.role === 'benson' && last.draft.action === 'clarify'
}
