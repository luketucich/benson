import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { cancelShortcutCapture, captureShortcutInput } from './recordingShortcut'

let mainWindow: BrowserWindow | null = null
let quitting = false

// Tells the close handler that the app is really shutting down.
export function markQuitting(): void {
  quitting = true
}

export function hasWindows(): boolean {
  return BrowserWindow.getAllWindows().length > 0
}

export function showWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

export function sendToWindow(channel: string, payload: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
}

export function createWindow(): void {
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

  window.on('ready-to-show', () => window.show())

  // Keep the recorder alive when the window is closed. The tray can reopen it.
  window.on('close', (event) => {
    if (quitting) return
    event.preventDefault()
    window.hide()
    void cancelShortcutCapture()
  })

  window.on('blur', () => void cancelShortcutCapture())
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
