import { rmSync } from 'fs'
import { getRecording, saveConversation } from './database'
import { suggestNote } from './noteSuggestion'
import { saveApprovedDraft } from './noteWriter'
import { transcribe, writeAudio } from './recordingFiles'
import { noteExists } from './vault'
import { PRACTICE_NOTE, practiceDraft } from './setup/practice'
import { onboardingShowing } from './setup'
import type { NoteDraft } from '../noteDraft'
import { lastSaid, type SavedRecording, type Turn } from '../recording'

// The back-and-forth after a recording: Benson writes a note or asks a
// question, you can reply by typing or talking, and each step is kept with the recording.

function findRecording(id: number): SavedRecording {
  const recording = getRecording(id)
  if (!recording?.transcript?.trim()) throw new Error('This recording has no transcript.')
  return recording
}

function addTurn(recording: SavedRecording, turn: Turn): void {
  saveConversation(recording.id, [...recording.conversation, turn])
}

// What Qwen reads: what you first said, then Benson's questions and your
// replies. Earlier notes are left out, since they were saved or discarded.
function request(recording: SavedRecording): string {
  const followUps = recording.conversation.flatMap((turn) => {
    if (turn.role === 'you') return [`I replied: ${turn.text}`]
    return turn.draft.action === 'clarify' ? [`Benson asked: ${turn.draft.explanation}`] : []
  })
  return [recording.transcript, ...followUps].join('\n')
}

// Asks Benson for a note, or a question, and keeps its reply.
// During onboarding's practice runs (practice), the note always goes into
// Welcome to Benson.
// Asks Benson about a recording and adds its answer to the thread. Answers
// with that reply and the last thing you said, for the panel to show.
export async function writeNote(id: number): Promise<{ draft: NoteDraft; said: string }> {
  const recording = findRecording(id)
  const followUp = recording.conversation.some((turn) => turn.role === 'you')
  const suggested = await suggestNote(request(recording), followUp)
  // During onboarding, every note is a practice note: it goes into Welcome to Benson.
  const draft = onboardingShowing()
    ? practiceDraft(suggested, noteExists(PRACTICE_NOTE))
    : suggested
  // Read the recording again: the thread may have changed while Qwen was writing.
  const latest = findRecording(id)
  addTurn(latest, { role: 'benson', draft })
  return { draft, said: lastSaid(latest) }
}

// Adds your reply to the thread, like an answer to Benson's question or "put
// it in Groceries instead". The screen then asks Benson to try again
// (writeNote), so your message shows up before Benson's answer does.
export function addReply(id: number, text: string, audioPath?: string): void {
  if (!text.trim()) throw new Error('Type or say a reply first.')
  addTurn(findRecording(id), { role: 'you', text: text.trim(), audio_path: audioPath })
}

// A reply you said out loud: it's transcribed, then kept with its audio.
export async function addVoiceReply(id: number, bytes: ArrayBuffer): Promise<void> {
  const { path } = writeAudio(bytes, '-reply')
  let text = ''
  try {
    text = await transcribe(path)
  } finally {
    // A reply with no words (or one that failed or was stopped) isn't kept.
    if (!text) rmSync(path, { force: true })
  }
  if (!text) throw new Error('I didn’t hear anything. Try again.')
  addReply(id, text, path)
}

// Saves the note to Obsidian, then remembers that it was saved and how it read.
// Whether it adds to a note or makes a new one depends on whether the file
// is already there, so a changed destination still saves the right way.
export async function saveNote(id: number, draft: NoteDraft): Promise<NoteDraft> {
  const saved: NoteDraft = { ...draft, action: noteExists(draft.path) ? 'append' : 'create' }
  await saveApprovedDraft(id, saved)
  finishDraft(id, 'saved', saved)
  return saved
}

export function discardNote(id: number): void {
  finishDraft(id, 'discarded')
}

// Marks Benson's latest note as saved or discarded.
function finishDraft(id: number, outcome: 'saved' | 'discarded', draft?: NoteDraft): void {
  const recording = findRecording(id)
  const turns = [...recording.conversation]
  const last = turns.at(-1)
  if (last?.role !== 'benson') return
  turns[turns.length - 1] = { ...last, outcome, draft: draft ?? last.draft }
  saveConversation(id, turns)
}
