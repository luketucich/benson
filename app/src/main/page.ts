import type { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

// Both windows load the same page and the same preload script.
export const preloadPath = join(__dirname, '../preload/index.js')

// Uses the development server while coding, or the built page otherwise.
// The panel passes view: 'panel' to get the floating panel instead of the app.
export function loadPage(window: BrowserWindow, view?: 'panel'): void {
  const query = view ? { view } : undefined
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const url = new URL(process.env['ELECTRON_RENDERER_URL'])
    if (view) url.searchParams.set('view', view)
    window.loadURL(url.toString())
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), { query })
  }
}
