import { useState } from 'react'
import type { SettingsControls } from '../hooks/useSettings'
import { FolderIcon } from '../components/icons'
import { Screen } from './Screen'

// Where notes go: a new vault, or one you already have. Either moves on once
// it's set; a vault Benson can't open shows a toast and stays here.
export function VaultStep({
  settings,
  onNext
}: {
  settings: SettingsControls
  onNext: () => void
}): React.JSX.Element {
  // Opening a vault takes a moment, so the buttons wait until it's done.
  const [busy, setBusy] = useState(false)

  async function pick(choose: () => Promise<boolean>): Promise<void> {
    setBusy(true)
    const switched = await choose()
    setBusy(false)
    if (switched) onNext()
  }

  return (
    <Screen
      visual={<FolderIcon />}
      title="Where should notes go?"
      description="Benson saves your notes into an Obsidian vault, which is just a folder of notes. Make a new one, or use one you already have."
    >
      <button
        className="button-primary onboarding-main"
        disabled={busy}
        onClick={() => void pick(settings.makeVault)}
      >
        Make a vault for me
      </button>
      <button
        className="button-ghost"
        disabled={busy}
        onClick={() => void pick(settings.chooseVault)}
      >
        Use my vault
      </button>
    </Screen>
  )
}
