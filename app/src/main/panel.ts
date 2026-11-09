import { BrowserWindow, screen } from 'electron'
import { loadPage, preloadPath } from './page'
import type { PanelStatus } from '../panel'

// The small floating window for shortcut recordings. It shows the progress,
// then the note, so the main window never pops up over what you're doing.

const WIDTH = 380
const MIN_HEIGHT = 64
// Tall enough for what you said, Benson's reply and a full note review.
const MAX_HEIGHT = 560
// The window is a bit bigger than the card so its shadow isn't cut off.
const MARGIN = 16
// How long the card takes to fade out (panel-out in panel.css).
const FADE_OUT_MS = 160

let panel: BrowserWindow | null = null
let status: PanelStatus | null = null
let hideTimer: NodeJS.Timeout | undefined
let onChange: (status: PanelStatus | null) => void = () => {}

export function createPanel(): void {
  panel = new BrowserWindow({
    width: WIDTH + MARGIN * 2,
    height: MIN_HEIGHT + MARGIN * 2,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    // A panel can take typing without making Benson the active app, so the
    // app you were in stays in front.
    type: 'panel',
    webPreferences: { preload: preloadPath, sandbox: false }
  })

  // Float above full-screen apps and follow you between desktops. Without
  // skipTransformProcessType, Electron would hide Benson's Dock icon.
  panel.setAlwaysOnTop(true, 'floating')
  panel.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
    skipTransformProcessType: true
  })

  loadPage(panel, 'panel')
}

export function getPanelStatus(): PanelStatus | null {
  return status
}

// Lets the main window follow what the panel shows, so it knows when a
// question is waiting for an answer.
export function watchPanel(listener: (status: PanelStatus | null) => void): void {
  onChange = listener
}

// Shows the panel with a new status, or hides it when there's nothing to show.
export function setPanelStatus(next: PanelStatus | null): void {
  status = next
  onChange(next)
  if (!panel || panel.isDestroyed()) return
  clearTimeout(hideTimer)
  panel.webContents.send('panel-status', next)

  if (!next) {
    hideTimer = setTimeout(() => panel?.hide(), FADE_OUT_MS)
    return
  }
  if (!panel.isVisible()) placeAtBottom(panel)
  // The review takes typing, so Enter can save and Esc can close it.
  if (next.kind === 'review') panel.show()
  else if (!panel.isVisible()) panel.showInactive()
}

// Once you're in the main window, a finished note or message in the panel is
// shown there too, so the panel can go.
export function closeFinishedPanel(): void {
  const kind = status?.kind
  if (kind === 'review' || kind === 'sent' || kind === 'error') setPanelStatus(null)
}

// Fits the window to the card, keeping the bottom edge where it is, so the
// panel grows upward.
export function resizePanel(cardHeight: number): void {
  if (!panel || panel.isDestroyed() || !Number.isFinite(cardHeight)) return
  const card = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(cardHeight)))
  const height = card + MARGIN * 2
  const { x, y, height: oldHeight } = panel.getBounds()
  // Ease between the small status and the full review instead of jumping.
  const animate = panel.isVisible() && Math.abs(height - oldHeight) > 24
  panel.setBounds({ x, y: y + oldHeight - height, width: WIDTH + MARGIN * 2, height }, animate)
}

// Centres the panel at the bottom of the screen you're working on. The
// window's margin leaves a small gap above the Dock.
function placeAtBottom(window: BrowserWindow): void {
  const { workArea } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const { height } = window.getBounds()
  const x = workArea.x + (workArea.width - WIDTH) / 2 - MARGIN
  const y = workArea.y + workArea.height - height
  window.setPosition(Math.round(x), Math.round(y))
}
