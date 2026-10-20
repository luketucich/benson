import { app, powerMonitor } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { closeDatabase, openDatabase } from './database'
import { closeVault, connectToVault } from './obsidian'
import { setDraftVault } from './noteWriter'
import {
  closeRecordingShortcut,
  releaseRecordingShortcut,
  setupRecordingShortcut
} from './recordingShortcut'
import { registerHandlers } from './ipc'
import { createTray } from './tray'
import { createWindow, hasWindows, markQuitting, sendToWindow, showWindow } from './window'

// For now, Benson uses one vault in Documents.
function connectVault(): void {
  const vaultPath = join(app.getPath('documents'), 'Benson Vault')
  mkdirSync(vaultPath, { recursive: true })
  const mcpVault = join(app.getAppPath(), 'node_modules/@bitbonsai/mcpvault/dist/server.js')

  connectToVault(vaultPath, mcpVault)
    .then(() => {
      setDraftVault(vaultPath)
      console.log(`Connected to the Obsidian vault at ${vaultPath}`)
    })
    .catch((error) => console.error('Could not connect to the Obsidian vault:', error))
}

// Set up storage and requests before opening the window.
app.whenReady().then(() => {
  const dataFolder = app.getPath('userData')
  mkdirSync(dataFolder, { recursive: true })
  openDatabase(join(dataFolder, 'benson.sqlite'))
  connectVault()

  electronApp.setAppUserModelId('com.luketucich.benson')

  // Set up Electron's development shortcuts.
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  registerHandlers()
  createTray()
  createWindow()

  void setupRecordingShortcut(
    dataFolder,
    (state) => sendToWindow('shortcut-state', state),
    (down) => sendToWindow('recording-shortcut', down)
  )

  // A held key would otherwise look stuck after the Mac sleeps or locks.
  powerMonitor.on('suspend', releaseRecordingShortcut)
  powerMonitor.on('lock-screen', releaseRecordingShortcut)

  // Reopen the window when the Dock icon is clicked.
  app.on('activate', () => (hasWindows() ? showWindow() : createWindow()))
})

app.on('before-quit', markQuitting)

app.on('will-quit', () => {
  closeRecordingShortcut()
  closeDatabase()
  closeVault()
})

// On Mac, keep the menu bar app running after the window closes.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
