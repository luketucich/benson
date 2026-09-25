import { contextBridge, ipcRenderer } from 'electron'
import type { SavedRecording } from '../recording'
import type { NoteDraft } from '../noteDraft'

// Send the audio to the matching handler in main/index.ts and wait for its reply.
async function saveRecording(bytes: ArrayBuffer): Promise<string> {
  const filePath = await ipcRenderer.invoke('save-recording', bytes)
  return filePath
}

async function transcribeRecording(filePath: string): Promise<string> {
  const transcript = await ipcRenderer.invoke('transcribe-recording', filePath)
  return transcript
}

async function getRecordings(): Promise<SavedRecording[]> {
  const recordings = await ipcRenderer.invoke('get-recordings')
  return recordings
}

async function readRecording(id: number): Promise<ArrayBuffer> {
  const audio = await ipcRenderer.invoke('read-recording', id)
  return audio
}

async function askQwen(prompt: string, transcript: string): Promise<NoteDraft> {
  const reply = await ipcRenderer.invoke('ask-qwen', prompt, transcript)
  return reply
}

async function saveApprovedDraft(id: number, draft: NoteDraft): Promise<void> {
  await ipcRenderer.invoke('save-approved-draft', id, draft)
}

// Let the page call these functions through window.api.
contextBridge.exposeInMainWorld('api', {
  saveRecording: saveRecording,
  transcribeRecording: transcribeRecording,
  getRecordings: getRecordings,
  readRecording: readRecording,
  askQwen: askQwen,
  saveApprovedDraft: saveApprovedDraft
})
