import { contextBridge, ipcRenderer } from 'electron'

// Send the audio to the matching handler in main/index.ts and wait for its reply.
async function saveRecording(bytes: ArrayBuffer): Promise<string> {
  const filePath = await ipcRenderer.invoke('save-recording', bytes)
  return filePath
}

async function transcribeRecording(filePath: string): Promise<string> {
  const transcript = await ipcRenderer.invoke('transcribe-recording', filePath)
  return transcript
}

// Let the page call these functions through window.api.
contextBridge.exposeInMainWorld('api', {
  saveRecording: saveRecording,
  transcribeRecording: transcribeRecording
})
