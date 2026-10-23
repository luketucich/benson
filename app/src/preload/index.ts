import { contextBridge, ipcRenderer } from 'electron'
import type { ShortcutState, RecordingActivity } from '../shortcut'

// Calls the listener whenever main sends on this channel. Returns a function that stops it.
function listen<T>(channel: string, listener: (value: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, value: T): void => listener(value)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

// Let the page call these through window.api. Each one matches a handler in main/ipc.ts.
contextBridge.exposeInMainWorld('api', {
  saveRecording: (bytes: ArrayBuffer) => ipcRenderer.invoke('save-recording', bytes),
  transcribeRecording: (filePath: string) => ipcRenderer.invoke('transcribe-recording', filePath),
  getRecordings: () => ipcRenderer.invoke('get-recordings'),
  readRecording: (id: number) => ipcRenderer.invoke('read-recording', id),
  askQwen: (prompt: string, transcript: string) =>
    ipcRenderer.invoke('ask-qwen', prompt, transcript),
  saveApprovedDraft: (id: number, draft: unknown) =>
    ipcRenderer.invoke('save-approved-draft', id, draft),
  getRecordingShortcut: () => ipcRenderer.invoke('get-recording-shortcut'),
  beginShortcutCapture: () => ipcRenderer.invoke('begin-shortcut-capture'),
  cancelShortcutCapture: () => ipcRenderer.invoke('cancel-shortcut-capture'),
  onShortcutState: (listener: (state: ShortcutState) => void) => listen('shortcut-state', listener),
  onRecordingShortcut: (listener: (down: boolean) => void) =>
    listen('recording-shortcut', listener),
  setRecordingActivity: (activity: RecordingActivity) =>
    ipcRenderer.send('recording-activity', activity),
  showReview: () => ipcRenderer.send('show-review')
})
