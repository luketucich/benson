import { contextBridge, ipcRenderer } from 'electron'
import type { ShortcutState, RecordingActivity } from '../shortcut'
import type { PanelAction, PanelStatus } from '../panel'
import type { NoteDraft } from '../noteDraft'
import type { PieceStatus } from '../setup'

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
  readAudio: (path: string) => ipcRenderer.invoke('read-audio', path),
  chooseNote: (current: string) => ipcRenderer.invoke('choose-note', current),
  deleteRecording: (id: number) => ipcRenderer.invoke('delete-recording', id),
  showRecordingMenu: () => ipcRenderer.invoke('recording-menu'),
  writeNote: (id: number) => ipcRenderer.invoke('write-note', id),
  addReply: (id: number, text: string) => ipcRenderer.invoke('add-reply', id, text),
  addVoiceReply: (id: number, bytes: ArrayBuffer) =>
    ipcRenderer.invoke('add-voice-reply', id, bytes),
  saveNote: (id: number, draft: NoteDraft) => ipcRenderer.invoke('save-note', id, draft),
  discardNote: (id: number) => ipcRenderer.invoke('discard-note', id),
  stopWork: () => ipcRenderer.send('stop-work'),
  getSetup: () => ipcRenderer.invoke('get-setup'),
  runSetup: () => ipcRenderer.invoke('run-setup'),
  finishSetup: () => ipcRenderer.invoke('finish-setup'),
  makeVault: () => ipcRenderer.invoke('make-vault'),
  micAccess: () => ipcRenderer.invoke('mic-access'),
  askMicAccess: () => ipcRenderer.invoke('ask-mic-access'),
  openMicSettings: () => ipcRenderer.invoke('open-mic-settings'),
  useSuggestedShortcut: () => ipcRenderer.invoke('use-suggested-shortcut'),
  showWindow: () => ipcRenderer.send('show-window'),
  onSetupProgress: (listener: (pieces: PieceStatus[]) => void) =>
    listen('setup-progress', listener),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveDevices: (micId: string, speakerId: string) =>
    ipcRenderer.invoke('save-devices', micId, speakerId),
  chooseVault: () => ipcRenderer.invoke('choose-vault'),
  getRecordingShortcut: () => ipcRenderer.invoke('get-recording-shortcut'),
  beginShortcutCapture: () => ipcRenderer.invoke('begin-shortcut-capture'),
  cancelShortcutCapture: () => ipcRenderer.invoke('cancel-shortcut-capture'),
  onShortcutState: (listener: (state: ShortcutState) => void) => listen('shortcut-state', listener),
  onRecordingShortcut: (listener: (down: boolean) => void) =>
    listen('recording-shortcut', listener),
  setRecordingActivity: (activity: RecordingActivity) =>
    ipcRenderer.send('recording-activity', activity),
  setPanelStatus: (status: PanelStatus | null) => ipcRenderer.send('panel-status', status),
  getPanelStatus: () => ipcRenderer.invoke('get-panel-status'),
  onPanelStatus: (listener: (status: PanelStatus | null) => void) =>
    listen('panel-status', listener),
  openFromPanel: () => ipcRenderer.send('panel-open'),
  closePanel: () => ipcRenderer.send('panel-close'),
  resizePanel: (height: number) => ipcRenderer.send('panel-size', height),
  panelAction: (action: PanelAction) => ipcRenderer.send('panel-action', action),
  onPanelAction: (listener: (action: PanelAction) => void) => listen('panel-action', listener)
})
