import { useEffect, useState } from 'react'
import { noteName } from '../../../noteDraft'
import type { Settings } from '../../../settings'
import { setSpeaker } from '../speaker'
import { useToast } from '../toast'

// Until the real settings load.
const startingSettings: Settings = { vaultPath: '', micId: '', speakerId: '' }

export interface SettingsControls {
  settings: Settings
  // Both answer true if the vault changed.
  chooseVault: () => Promise<boolean>
  makeVault: () => Promise<boolean>
  chooseMic: (id: string) => Promise<void>
  chooseSpeaker: (id: string) => Promise<void>
}

// Benson's settings, loaded from main, with ways to change them.
export function useSettings(): SettingsControls {
  const [settings, setSettings] = useState(startingSettings)
  const toast = useToast()

  async function saveDevices(micId: string, speakerId: string): Promise<void> {
    try {
      setSettings(await window.api.saveDevices(micId, speakerId))
    } catch {
      toast('I couldn’t save that device.', 'error')
    }
  }

  // Switches vault and says so in a toast. True if it switched.
  async function switchVault(choose: () => Promise<Settings | null>): Promise<boolean> {
    try {
      const next = await choose()
      if (!next) return false
      toast(`Vault set to ${noteName(next.vaultPath)}`)
      setSettings(next)
      return true
    } catch {
      toast('I couldn’t open that vault.', 'error')
      return false
    }
  }

  useEffect(() => {
    void window.api.getSettings().then(setSettings)
  }, [])

  // Sounds and playback follow the chosen speaker.
  useEffect(() => setSpeaker(settings.speakerId), [settings.speakerId])

  return {
    settings,
    // Asks for a folder. Cancelling changes nothing.
    chooseVault: () => switchVault(window.api.chooseVault),
    // Onboarding's "Make a vault for me".
    makeVault: () => switchVault(window.api.makeVault),
    chooseMic: (id) => saveDevices(id, settings.speakerId),
    chooseSpeaker: (id) => saveDevices(settings.micId, id)
  }
}
