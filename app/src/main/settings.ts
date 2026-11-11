import { app } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { Settings } from '../settings'

// What's saved: the settings the screen can change, plus whether onboarding
// has been finished, which only main needs to know.
type SavedSettings = Settings & { setupDone: boolean }

// Settings live in a small JSON file next to Benson's database.

function settingsFile(): string {
  return join(app.getPath('userData'), 'settings.json')
}

// The vault onboarding's "Make a vault for me" creates.
export function defaultVaultPath(): string {
  return join(app.getPath('documents'), 'Benson Vault')
}

function defaults(): SavedSettings {
  return {
    vaultPath: defaultVaultPath(),
    micId: '',
    speakerId: '',
    setupDone: false
  }
}

// What's in the settings file, or nothing if there's no file yet.
function savedSettings(): Partial<SavedSettings> {
  try {
    return JSON.parse(readFileSync(settingsFile(), 'utf8'))
  } catch {
    return {}
  }
}

export function getSettings(): SavedSettings {
  return { ...defaults(), ...savedSettings() }
}

export function saveSettings(changes: Partial<SavedSettings>): SavedSettings {
  const settings = { ...getSettings(), ...changes }
  writeFileSync(settingsFile(), JSON.stringify(settings, null, 2))
  return settings
}

// Copies of Benson from before onboarding existed have recordings already, so
// they count as set up instead of being sent through it.
export function markSetUpIfAlreadyUsed(hasRecordings: () => boolean): void {
  if (savedSettings().setupDone === undefined && hasRecordings()) saveSettings({ setupDone: true })
}
