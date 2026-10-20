import { app } from 'electron'
import { mkdirSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { saveRecording, saveTranscript } from './database'

// Allow us to wait for a program to finish using await.
const runProgram = promisify(execFile)

// Writes the clip to disk and records it before transcription, so the entry
// remains even if transcription fails.
export function saveAudio(bytes: ArrayBuffer): string {
  const folder = join(app.getPath('userData'), 'recordings')
  mkdirSync(folder, { recursive: true })

  // Use the recording time as the file name, with dashes instead of punctuation.
  const createdAt = new Date().toISOString()
  const filePath = join(folder, createdAt.replace(/[:.]/g, '-') + '.webm')
  writeFileSync(filePath, Buffer.from(bytes))
  saveRecording(filePath, createdAt)
  return filePath
}

// Runs scripts/transcribe.py, which lives one level above the app folder.
export async function transcribeAudio(filePath: string): Promise<string> {
  const script = join(app.getAppPath(), '..', 'scripts', 'transcribe.py')
  const result = await runProgram('uv', ['run', script, filePath])

  const transcript = result.stdout.trim()
  saveTranscript(filePath, transcript)
  return transcript
}

export async function readAudio(filePath: string): Promise<ArrayBuffer> {
  const bytes = await readFile(filePath)
  return new Uint8Array(bytes).buffer
}
