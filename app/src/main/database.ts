import { DatabaseSync } from 'node:sqlite'
import type { SavedRecording } from '../recording'

let database: DatabaseSync

export function openDatabase(filePath: string): void {
  database = new DatabaseSync(filePath)

  // Keep existing recordings when the app starts again.
  database.exec(`
    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY,
      created_at TEXT NOT NULL,
      audio_path TEXT NOT NULL UNIQUE,
      transcript TEXT
    )
  `)
}

export function saveRecording(filePath: string, createdAt: string): void {
  // The question marks are filled with values by SQLite.
  const statement = database.prepare(`
    INSERT INTO recordings (audio_path, created_at)
    VALUES (?, ?)
  `)
  statement.run(filePath, createdAt)
}

export function saveTranscript(filePath: string, transcript: string): void {
  const statement = database.prepare(`
    UPDATE recordings SET transcript = ? WHERE audio_path = ?
  `)
  const result = statement.run(transcript, filePath)

  if (result.changes === 0) {
    throw new Error('The recording was not found in the database.')
  }
}

export function closeDatabase(): void {
  if (database) database.close()
}

export function getRecordings(): SavedRecording[] {
  const statement = database.prepare('SELECT * FROM recordings ORDER BY created_at DESC, id DESC')
  return statement.all() as SavedRecording[]
}

export function getRecording(id: number): SavedRecording | undefined {
  const statement = database.prepare('SELECT * FROM recordings WHERE id = ?')
  return statement.get(id) as SavedRecording | undefined
}
