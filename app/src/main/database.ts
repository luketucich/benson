import { DatabaseSync } from 'node:sqlite'
import type { SavedRecording, Turn } from '../recording'

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

  // Add columns that older databases are missing.
  const columns = database.prepare('PRAGMA table_info(recordings)').all()
  const has = (name: string): boolean => columns.some((column) => column.name === name)
  if (!has('sent_at')) database.exec('ALTER TABLE recordings ADD COLUMN sent_at TEXT')
  if (!has('conversation')) {
    database.exec("ALTER TABLE recordings ADD COLUMN conversation TEXT NOT NULL DEFAULT '[]'")
  }
}

// The conversation is stored as JSON text, so turn it back into a list.
function readRow(row: unknown): SavedRecording {
  const recording = row as Omit<SavedRecording, 'conversation'> & { conversation: string }
  return { ...recording, conversation: JSON.parse(recording.conversation) }
}

export function saveRecording(filePath: string, createdAt: string): number {
  // The question marks are filled with values by SQLite.
  const statement = database.prepare(`
    INSERT INTO recordings (audio_path, created_at)
    VALUES (?, ?)
  `)
  return Number(statement.run(filePath, createdAt).lastInsertRowid)
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

export function markRecordingSent(id: number): void {
  const statement = database.prepare('UPDATE recordings SET sent_at = ? WHERE id = ?')
  statement.run(new Date().toISOString(), id)
}

export function saveConversation(id: number, conversation: Turn[]): void {
  const statement = database.prepare('UPDATE recordings SET conversation = ? WHERE id = ?')
  statement.run(JSON.stringify(conversation), id)
}

export function deleteRecording(id: number): void {
  database.prepare('DELETE FROM recordings WHERE id = ?').run(id)
}

export function closeDatabase(): void {
  if (database) database.close()
}

export function getRecordings(): SavedRecording[] {
  const statement = database.prepare('SELECT * FROM recordings ORDER BY created_at DESC, id DESC')
  return statement.all().map(readRow)
}

// True if there's at least one recording, without loading them all.
export function hasRecordings(): boolean {
  return database.prepare('SELECT 1 FROM recordings LIMIT 1').get() !== undefined
}

export function getRecording(id: number): SavedRecording | undefined {
  const row = database.prepare('SELECT * FROM recordings WHERE id = ?').get(id)
  return row ? readRow(row) : undefined
}
