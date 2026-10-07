import { app, shell, BrowserWindow, Tray, Menu, nativeImage, ipcMain, powerMonitor } from 'electron'
import { join } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import trayIcon from '../../resources/trayTemplate.png?asset'
import {
  openDatabase,
  saveRecording,
  saveTranscript,
  closeDatabase,
  getRecordings,
  getRecording
} from './database'
import { connectToVault, closeVault } from './obsidian'
import { suggestNote } from './noteSuggestion'
import { saveApprovedDraft, setDraftVault } from './noteWriter'
import {
  setupRecordingShortcut,
  getShortcutState,
  beginShortcutCapture,
  cancelShortcutCapture,
  captureShortcutInput,
  releaseRecordingShortcut,
  closeRecordingShortcut
} from './recordingShortcut'
import type { RecordingActivity } from '../shortcut'

// Allow us to wait for a program to finish using await.
const runProgram = promisify(execFile)

// Kept at module scope so the tray is not garbage collected.
let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let quitting = false
let activity: RecordingActivity = 'idle'

function showWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createTray(): void {
  tray = new Tray(nativeImage.createFromPath(trayIcon))
  tray.setToolTip('Benson')

  const menu = Menu.buildFromTemplate([
    { label: 'Open Benson', click: showWindow },
    { label: 'Quit Benson', role: 'quit' }
  ])
  tray.on('click', showWindow)
  tray.on('right-click', () => tray?.popUpContextMenu(menu))
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      backgroundThrottling: false,
      sandbox: false
    }
  })
  mainWindow = window

  window.on('ready-to-show', () => {
    window.show()
  })
  // Keep the recorder alive when the window is closed. The tray can reopen it.
  window.on('close', (event) => {
    if (!quitting) {
      event.preventDefault()
      window.hide()
      void cancelShortcutCapture()
    }
  })
  window.on('blur', () => {
    void cancelShortcutCapture()
  })
  window.webContents.on('before-input-event', captureShortcutInput)

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Use the development server while coding, or the built page otherwise.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Set up storage and requests before opening the window.
app.whenReady().then(() => {
  const dataFolder = app.getPath('userData')
  mkdirSync(dataFolder, { recursive: true })
  openDatabase(join(dataFolder, 'benson.sqlite'))

  // For now, Benson uses one vault in Documents.
  const vaultPath = join(app.getPath('documents'), 'Benson Vault')
  mkdirSync(vaultPath, { recursive: true })
  const mcpVault = join(app.getAppPath(), 'node_modules/@bitbonsai/mcpvault/dist/server.js')
  connectToVault(vaultPath, mcpVault)
    .then(() => {
      setDraftVault(vaultPath)
      console.log(`Connected to the Obsidian vault at ${vaultPath}`)
    })
    .catch((error) => console.error('Could not connect to the Obsidian vault:', error))

  electronApp.setAppUserModelId('com.luketucich.benson')

  // Set up Electron's development shortcuts.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // The page sends the recording here to be written to disk.
  ipcMain.handle('save-recording', (_, bytes: ArrayBuffer) => {
    const folder = join(app.getPath('userData'), 'recordings')
    mkdirSync(folder, { recursive: true })

    // Use the recording time as the file name, with dashes instead of punctuation.
    const createdAt = new Date().toISOString()
    const name = createdAt.replace(/[:.]/g, '-') + '.webm'
    const filePath = join(folder, name)
    writeFileSync(filePath, Buffer.from(bytes))
    // Save the entry before transcription, so it remains if transcription fails.
    saveRecording(filePath, createdAt)
    return filePath
  })

  // The page sends a saved recording path here to be turned into text.
  ipcMain.handle('transcribe-recording', async (_, filePath: string) => {
    // The script lives in the repo's scripts folder, one level above the app folder.
    const script = join(app.getAppPath(), '..', 'scripts', 'transcribe.py')

    // This runs: uv run <script> <recording path>.
    const argumentsForPython = ['run', script, filePath]
    const result = await runProgram('uv', argumentsForPython)

    // stdout is the text Python printed. Send it back to the page.
    const transcript = result.stdout.trim()
    saveTranscript(filePath, transcript)
    return transcript
  })

  ipcMain.handle('get-recordings', () => {
    return getRecordings()
  })

  ipcMain.handle('read-recording', async (_, id: number) => {
    const recording = getRecording(id)
    if (!recording) {
      throw new Error('Recording not found.')
    }

    // Look up the saved path here, then send the audio bytes to the page.
    const bytes = await readFile(recording.audio_path)
    const audio = new Uint8Array(bytes)
    return audio.buffer
  })

  ipcMain.handle('ask-qwen', async (_, prompt: string, transcript: string) => {
    if (!prompt.trim() || !transcript.trim())
      throw new Error('A prompt and transcript are required.')
    return suggestNote(prompt, transcript)
  })

  ipcMain.handle('save-approved-draft', (_, id: number, draft: unknown) => {
    return saveApprovedDraft(id, draft)
  })

  ipcMain.handle('get-recording-shortcut', getShortcutState)
  ipcMain.handle('begin-shortcut-capture', () => {
    if (activity !== 'idle') throw new Error('Finish your recording before changing the shortcut.')
    return beginShortcutCapture()
  })
  ipcMain.handle('cancel-shortcut-capture', cancelShortcutCapture)
  ipcMain.on('recording-activity', (_, next: RecordingActivity) => {
    if (!['idle', 'starting', 'recording', 'processing'].includes(next)) return
    activity = next
    const title = next === 'recording' ? 'Recording…' : next === 'processing' ? 'Working…' : ''
    if (process.platform === 'darwin') tray?.setTitle(title)
    tray?.setToolTip(title ? `Benson — ${title}` : 'Benson')
  })
  ipcMain.on('show-review', showWindow)

  createTray()
  createWindow()
  void setupRecordingShortcut(
    dataFolder,
    (state) => {
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send('shortcut-state', state)
    },
    (down) => {
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send('recording-shortcut', down)
    }
  )
  powerMonitor.on('suspend', releaseRecordingShortcut)
  powerMonitor.on('lock-screen', releaseRecordingShortcut)

  app.on('activate', function () {
    // Reopen the window when the Dock icon is clicked.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else showWindow()
  })
})

app.on('before-quit', () => {
  quitting = true
})

app.on('will-quit', () => {
  closeRecordingShortcut()
  closeDatabase()
  closeVault()
})

// On Mac, keep the menu bar app running after the window closes.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
