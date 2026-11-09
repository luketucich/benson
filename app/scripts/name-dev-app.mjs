// In development, Benson runs inside Electron's own app, so the Dock says
// "Electron" and shows its icon. This renames the project's copy of Electron
// (only the one in node_modules) to Benson.app and gives it Benson's icon.
// The built app is named by electron-builder, so it doesn't need this.
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, renameSync, utimesSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// The app folder, one level above this script.
const root = fileURLToPath(new URL('../', import.meta.url))

if (process.platform === 'darwin') {
  const electron = root + 'node_modules/electron/'
  const app = electron + 'dist/Benson.app/'

  // The Dock takes its label from the folder name. A fresh npm install brings
  // Electron.app back, so rename it whenever it shows up, and point Electron
  // at the new name.
  if (existsSync(electron + 'dist/Electron.app')) renameSync(electron + 'dist/Electron.app', app)
  writeFileSync(electron + 'path.txt', 'Benson.app/Contents/MacOS/Electron')

  const plist = app + 'Contents/Info.plist'
  for (const key of ['CFBundleName', 'CFBundleDisplayName']) {
    execFileSync('/usr/libexec/PlistBuddy', ['-c', `Set :${key} Benson`, plist])
  }
  copyFileSync(root + 'build/icon.icns', app + 'Contents/Resources/electron.icns')

  // Touching the app tells Finder and the Dock to pick up the new name and icon.
  const now = new Date()
  utimesSync(app, now, now)
}
