import { dialog, ipcMain, shell, systemPreferences } from 'electron'
import { dev } from './dev'
import { getRecordings } from './database'
import { defaultVaultPath, getSettings, saveSettings } from './settings'
import { askMenu } from './menu'
import { stopWork } from './work'
import { checkSetup, finishOnboarding, runSetup } from './setup'
import { chooseNote, switchVault } from './vault'
import { addReply, addVoiceReply, discardNote, saveNote, writeNote } from './conversation'
import { readAudio, removeRecording, saveAudio, transcribeAudio } from './recordingFiles'
import {
  beginShortcutCapture,
  cancelShortcutCapture,
  getShortcutState,
  setShortcut
} from './recordingShortcut'
import { getPanelStatus, resizePanel, setPanelStatus, watchPanel } from './panel'
import { showActivity } from './tray'
import { openWindow, sendToWindow } from './window'
import { recordingActivities, suggestedShortcut, type RecordingActivity } from '../shortcut'
import { isPanelAction, isPanelStatus } from '../panel'
import { validateDraft } from '../noteDraft'

// What the screen is doing right now, so the shortcut cannot change mid-recording.
let activity: RecordingActivity = 'idle'

// The shortcut can't change in the middle of a recording.
function requireIdle(): void {
  if (activity !== 'idle') throw new Error('Finish your recording before changing the shortcut.')
}

// Every request the screen can make goes through here.
export function registerHandlers(): void {
  ipcMain.handle('save-recording', (_, bytes: ArrayBuffer) => saveAudio(bytes))
  ipcMain.handle('transcribe-recording', (_, filePath: string) => transcribeAudio(filePath))
  ipcMain.handle('get-recordings', () => getRecordings())

  ipcMain.handle('delete-recording', (_, id: number) => removeRecording(id))

  // The "..." menu on a recording. Answers 'delete', or null if it was closed.
  ipcMain.handle('recording-menu', (event) =>
    askMenu(event.sender, [{ label: 'Delete Recording', value: 'delete' as const }])
  )

  // Benson's side of the conversation.
  ipcMain.handle('write-note', (_, id: number) => writeNote(id))
  ipcMain.handle('add-reply', (_, id: number, text: unknown) => addReply(id, String(text)))
  ipcMain.handle('add-voice-reply', (_, id: number, bytes: ArrayBuffer) => addVoiceReply(id, bytes))
  ipcMain.handle('save-note', (_, id: number, draft: unknown) => saveNote(id, validateDraft(draft)))
  ipcMain.handle('discard-note', (_, id: number) => discardNote(id))
  ipcMain.on('stop-work', stopWork)

  // Onboarding: what's installed, installing the rest, and finishing.
  ipcMain.handle('get-setup', checkSetup)
  ipcMain.handle('run-setup', () => runSetup((pieces) => sendToWindow('setup-progress', pieces)))
  ipcMain.handle('finish-setup', finishOnboarding)
  ipcMain.handle('read-audio', (_, path: string) => readAudio(path))
  // Picking where a note goes: a note that's already there, or a new one.
  ipcMain.handle('choose-note', async (event, current: unknown) => {
    const kind = await askMenu(event.sender, [
      { label: 'Add to a Note...', value: 'append' as const },
      { label: 'New Note...', value: 'create' as const }
    ])
    return kind && chooseNote(String(current), kind)
  })

  // The settings menu.
  ipcMain.handle('get-settings', getSettings)
  ipcMain.handle('save-devices', (_, micId: unknown, speakerId: unknown) => {
    if (typeof micId !== 'string' || typeof speakerId !== 'string')
      throw new Error('Pick a device.')
    return saveSettings({ micId, speakerId })
  })
  // Asks for a folder, then switches Benson to it. Cancelling changes nothing
  // and answers null.
  ipcMain.handle('choose-vault', async () => {
    const choice = await dialog.showOpenDialog({
      title: 'Choose your Obsidian vault',
      defaultPath: getSettings().vaultPath,
      properties: ['openDirectory', 'createDirectory']
    })
    if (choice.canceled || !choice.filePaths[0]) return null
    return switchVault(choice.filePaths[0])
  })
  // Onboarding's "Make a vault for me": a new vault in Documents.
  ipcMain.handle('make-vault', () => switchVault(defaultVaultPath()))

  // The microphone permission, for onboarding's mic step.
  ipcMain.handle('mic-access', () =>
    dev.pretendMicDenied ? 'denied' : systemPreferences.getMediaAccessStatus('microphone')
  )
  ipcMain.handle('ask-mic-access', () =>
    dev.pretendMicDenied ? false : systemPreferences.askForMediaAccess('microphone')
  )
  ipcMain.handle('open-mic-settings', () =>
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone')
  )

  ipcMain.handle('get-recording-shortcut', getShortcutState)
  ipcMain.handle('begin-shortcut-capture', () => {
    requireIdle()
    return beginShortcutCapture()
  })
  ipcMain.handle('cancel-shortcut-capture', cancelShortcutCapture)
  ipcMain.handle('use-suggested-shortcut', () => {
    requireIdle()
    return setShortcut(suggestedShortcut)
  })

  ipcMain.on('recording-activity', (_, next: RecordingActivity) => {
    if (!recordingActivities.includes(next)) return
    activity = next
    showActivity(next)
  })

  // The floating panel. The main window does the work and tells the panel what
  // to show; the panel sends Save, Discard, and Open back.
  ipcMain.handle('get-panel-status', getPanelStatus)
  watchPanel((status) => sendToWindow('panel-status', status))
  ipcMain.on('panel-status', (_, status: unknown) => {
    if (status === null || isPanelStatus(status)) setPanelStatus(status)
  })
  ipcMain.on('panel-size', (_, height: unknown) => {
    if (typeof height === 'number') resizePanel(height)
  })
  ipcMain.on('panel-close', () => setPanelStatus(null))
  ipcMain.on('panel-action', (_, action: unknown) => {
    if (isPanelAction(action)) sendToWindow('panel-action', action)
  })
  ipcMain.on('panel-open', () => {
    setPanelStatus(null)
    void openWindow()
  })
  // Onboarding brings the window back after the pop-up practice.
  ipcMain.on('show-window', () => void openWindow())
}
