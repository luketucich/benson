import { app, BrowserWindow, shell } from 'electron'
import { execFile } from 'child_process'
import { resolve } from 'path'
import { loadPage, preloadPath } from './page'
import { closeFinishedPanel } from './panel'
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

export async function showWindow(): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return
  // Benson is in the Dock only while its window is open, like other menu bar apps.
  // Wait for it to be back there, or macOS won't let it come to the front.
  await app.dock?.show()
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

// Puts Benson in front of the app you're using. macOS ignores an app that asks
// to jump ahead on its own, so this asks the system to open Benson instead,
// the same as clicking it in the Dock.
export function bringToFront(): void {
  const bundle = resolve(app.getPath('exe'), '../../..')
  execFile(
    'open',
    [bundle],
    (error) => error && console.error('Could not bring Benson forward.', error)
  )
}

// Opens the window and puts Benson in front of the app you're using: for the
// menu bar's Open Benson, the panel's Open button, and onboarding.
export async function openWindow(): Promise<void> {
  await showWindow()
  bringToFront()
}

export function sendToWindow(channel: string, payload: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload)
}

export function createWindow(): void {
  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    minWidth: 640,
    minHeight: 480,
    autoHideMenuBar: true,
    // Let the sidebar run under the window buttons, like other Mac apps.
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#17161a',
    webPreferences: {
      preload: preloadPath,
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
    app.dock?.hide()
    void cancelShortcutCapture()
  })

  window.on('blur', () => void cancelShortcutCapture())
  window.on('focus', closeFinishedPanel)
  window.webContents.on('before-input-event', captureShortcutInput)

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  loadPage(window)
}
