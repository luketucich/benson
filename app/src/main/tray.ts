import { Menu, Tray, nativeImage } from 'electron'
import trayIcon from '../../resources/trayTemplate.png?asset'
import { showWindow } from './window'
import type { RecordingActivity } from '../shortcut'

// Kept at module scope so the tray is not garbage collected.
let tray: Tray | null = null

export function createTray(): void {
  tray = new Tray(nativeImage.createFromPath(trayIcon))
  tray.setToolTip('Benson')

  const menu = Menu.buildFromTemplate([
    { label: 'Open Benson', click: showWindow },
    { label: 'Quit Benson', role: 'quit' }
  ])
  tray.on('click', showWindow)
  tray.on('right-click', () => tray?.popUpContextMenu(menu))
}

// Shows what Benson is doing next to the menu bar icon.
export function showActivity(activity: RecordingActivity): void {
  const title =
    activity === 'recording' ? 'Recording...' : activity === 'processing' ? 'Working...' : ''
  if (process.platform === 'darwin') tray?.setTitle(title)
  tray?.setToolTip(title ? `Benson: ${title}` : 'Benson')
}
