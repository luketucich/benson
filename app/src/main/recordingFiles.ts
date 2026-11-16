import { app, shell } from 'electron'
import { mkdirSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { deleteRecording, getRecording, saveRecording, saveTranscript } from './database'
import { wasStopped, workSignal } from './work'

// Allow us to wait for a program to finish using await.
const runProgram = promisify(execFile)

function recordingsFolder(): string {
  return join(app.getPath('userData'), 'recordings')
}

// Benson only ever reads or removes audio it saved itself.
function isOurs(filePath: string): boolean {
  return dirname(filePath) === recordingsFolder()
}

// Writes a clip to disk, named after the time it was recorded.
export function writeAudio(bytes: ArrayBuffer, suffix = ''): { path: string; createdAt: string } {
  const folder = recordingsFolder()
  mkdirSync(folder, { recursive: true })
  const createdAt = new Date().toISOString()
  const path = join(folder, createdAt.replace(/[:.]/g, '-') + suffix + '.webm')
  writeFileSync(path, Buffer.from(bytes))
  return { path, createdAt }
}

// Saves a new recording. It goes in the database before transcription, so
// the entry stays even if transcription fails.
export function saveAudio(bytes: ArrayBuffer): { id: number; path: string } {
  const { path, createdAt } = writeAudio(bytes)
  return { id: saveRecording(path, createdAt), path }
}

// Where scripts/transcribe.py is. While developing it sits one level above the
// app folder; the built app carries a copy in its Resources folder.
export function transcribeScript(): string {
  const scripts = app.isPackaged
    ? join(process.resourcesPath, 'scripts')
    : join(app.getAppPath(), '..', 'scripts')
  return join(scripts, 'transcribe.py')
}

// Runs the speech-to-text script on a recording.
export async function transcribe(filePath: string): Promise<string> {
  const script = transcribeScript()
  try {
    // Pressing Stop ends the program partway through.
    const result = await runProgram('uv', ['run', script, filePath], { signal: workSignal() })
    return result.stdout.trim()
  } catch (error) {
    const problem = error as NodeJS.ErrnoException & { stderr?: string }
    console.error('Transcription failed:', problem.stderr || problem.message)
    if (wasStopped(error)) throw error
    // Turn what went wrong into words you can act on.
    if (problem.code === 'ENOENT') throw new Error('Speech to text isn’t set up yet. Install uv.')
    if (problem.stderr?.includes('FFmpeg is missing')) {
      throw new Error('Speech to text needs FFmpeg. Install it with Homebrew.')
    }
    throw new Error('I couldn’t turn that into text. Try again.')
  }
}

// Transcribes a recording and keeps the text with it.
export async function transcribeAudio(filePath: string): Promise<string> {
  if (!isOurs(filePath)) throw new Error('That audio is not one of Benson’s recordings.')
  const transcript = await transcribe(filePath)
  saveTranscript(filePath, transcript)
  return transcript
}

export async function readAudio(filePath: string): Promise<ArrayBuffer> {
  if (!isOurs(filePath)) throw new Error('That audio is not one of Benson’s recordings.')
  const bytes = await readFile(filePath)
  return new Uint8Array(bytes).buffer
}

// Removes a recording from the history and moves its audio, and any spoken
// answers, to the Trash, where they can still be recovered.
export async function removeRecording(id: number): Promise<void> {
  const recording = getRecording(id)
  if (!recording) return
  const answers = recording.conversation.flatMap((turn) =>
    turn.role === 'you' && turn.audio_path ? [turn.audio_path] : []
  )
  for (const path of [recording.audio_path, ...answers]) {
    if (isOurs(path)) await shell.trashItem(path).catch(() => {})
  }
  deleteRecording(id)
}
