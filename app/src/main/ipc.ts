import { ipcMain } from 'electron'
import { getRecording, getRecordings } from './database'
import { suggestNote } from './noteSuggestion'
import { saveApprovedDraft } from './noteWriter'
import { readAudio, saveAudio, transcribeAudio } from './recordingFiles'
import { beginShortcutCapture, cancelShortcutCapture, getShortcutState } from './recordingShortcut'
import { showActivity } from './tray'
import { showWindow } from './window'
import type { RecordingActivity } from '../shortcut'

const activities: RecordingActivity[] = ['idle', 'starting', 'recording', 'processing']

// What the screen is doing right now, so the shortcut cannot change mid-recording.
let activity: RecordingActivity = 'idle'

// Every request the screen can make goes through here.
export function registerHandlers(): void {
  ipcMain.handle('save-recording', (_, bytes: ArrayBuffer) => saveAudio(bytes))
  ipcMain.handle('transcribe-recording', (_, filePath: string) => transcribeAudio(filePath))
  ipcMain.handle('get-recordings', () => getRecordings())

  ipcMain.handle('read-recording', (_, id: number) => {
    const recording = getRecording(id)
    if (!recording) throw new Error('Recording not found.')
    return readAudio(recording.audio_path)
  })

  ipcMain.handle('ask-qwen', (_, prompt: string, transcript: string) => {
    if (!prompt.trim() || !transcript.trim())
      throw new Error('A prompt and transcript are required.')
    return suggestNote(prompt, transcript)
  })

  ipcMain.handle('save-approved-draft', (_, id: number, draft: unknown) =>
    saveApprovedDraft(id, draft)
  )

  ipcMain.handle('get-recording-shortcut', getShortcutState)
  ipcMain.handle('begin-shortcut-capture', () => {
    if (activity !== 'idle') throw new Error('Finish your recording before changing the shortcut.')
    return beginShortcutCapture()
  })
  ipcMain.handle('cancel-shortcut-capture', cancelShortcutCapture)

  ipcMain.on('recording-activity', (_, next: RecordingActivity) => {
    if (!activities.includes(next)) return
    activity = next
    showActivity(next)
  })

  ipcMain.on('show-review', showWindow)
}
