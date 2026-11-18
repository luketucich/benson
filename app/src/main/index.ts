import { app, powerMonitor } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { homedir } from 'os'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import appIcon from '../../build/icon.png?asset'
import { closeDatabase, hasRecordings, openDatabase } from './database'
import { closeVault } from './obsidian'
import { startOllama, stopOllama } from './ollama'
import {
  closeRecordingShortcut,
  releaseRecordingShortcut,
  setupRecordingShortcut
} from './recordingShortcut'
import { registerHandlers } from './ipc'
import { getSettings, markSetUpIfAlreadyUsed } from './settings'
import { toolsBin } from './setup/paths'
import { openVault } from './vault'
import { createPanel } from './panel'
import { createTray } from './tray'
import { createWindow, hasWindows, markQuitting, sendToWindow, showWindow } from './window'

// Apps opened from Finder get a bare PATH, so add the folders where uv,
// FFmpeg and Ollama are usually installed.
// Benson's own downloads come first (see setup/paths.ts).
process.env.PATH = [
  toolsBin(),
  join(homedir(), '.local/bin'),
  '/opt/homebrew/bin',
  '/usr/local/bin',
  process.env.PATH
].join(':')

// Set up storage and requests before opening the window.
app.whenReady().then(() => {
  const dataFolder = app.getPath('userData')
  mkdirSync(dataFolder, { recursive: true })
  openDatabase(join(dataFolder, 'benson.sqlite'))
  markSetUpIfAlreadyUsed(hasRecordings)
  // A new copy of Benson waits for onboarding's vault step, so no folder is
  // made before you choose one.
  if (getSettings().setupDone) {
    openVault(getSettings().vaultPath).catch((error) =>
      console.error('Could not connect to the Obsidian vault:', error)
    )
  }
  void startOllama()

  electronApp.setAppUserModelId('com.luketucich.benson')

  // The built app gets its icon from build/icon.icns. In development the Dock
  // would show Electron's icon instead.
  if (is.dev) app.dock?.setIcon(appIcon)

  // Set up Electron's development shortcuts.
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  registerHandlers()
  createTray()
  createWindow()
  createPanel()

  void setupRecordingShortcut(
    dataFolder,
    (state) => sendToWindow('shortcut-state', state),
    (down) => sendToWindow('recording-shortcut', down)
  )

  // A held key would otherwise look stuck after the Mac sleeps or locks.
  powerMonitor.on('suspend', releaseRecordingShortcut)
  powerMonitor.on('lock-screen', releaseRecordingShortcut)

  // Reopen the window when the Dock icon is clicked.
  app.on('activate', () => (hasWindows() ? void showWindow() : createWindow()))
})

app.on('before-quit', markQuitting)

app.on('will-quit', () => {
  closeRecordingShortcut()
  closeDatabase()
  closeVault()
  stopOllama()
})

// On Mac, keep the menu bar app running after the window closes.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
