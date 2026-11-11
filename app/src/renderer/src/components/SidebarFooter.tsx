import { useCallback, useState } from 'react'
import type { ShortcutState } from '../../../shortcut'
import type { SettingsControls } from '../hooks/useSettings'
import { GearIcon } from './icons'
import { SettingsMenu } from './SettingsMenu'

interface Props {
  shortcut: ShortcutState
  shortcutButton: string
  busy: boolean
  settings: SettingsControls
  onChangeShortcut: () => void
}

// The bottom of the sidebar: a Settings button that opens the settings menu above it.
export function SidebarFooter({
  shortcut,
  shortcutButton,
  busy,
  settings: { settings, chooseVault, chooseMic, chooseSpeaker },
  onChangeShortcut
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <footer className="sidebar-footer">
      <button
        className="settings-button"
        aria-expanded={open}
        // Stops the menu's outside-click check from reopening it right away.
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => setOpen(!open)}
      >
        <GearIcon /> Settings
      </button>

      {open && (
        <SettingsMenu
          shortcut={shortcut}
          shortcutButton={shortcutButton}
          busy={busy}
          settings={settings}
          onChangeShortcut={onChangeShortcut}
          onChooseVault={() => void chooseVault()}
          onChooseMic={(id) => void chooseMic(id)}
          onChooseSpeaker={(id) => void chooseSpeaker(id)}
          onClose={close}
        />
      )}
    </footer>
  )
}
