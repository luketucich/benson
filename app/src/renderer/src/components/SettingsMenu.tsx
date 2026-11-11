import { useEffect, useRef } from 'react'
import { noteName } from '../../../noteDraft'
import type { Settings } from '../../../settings'
import { shownKeys, type ShortcutState } from '../../../shortcut'
import { useAudioDevices } from '../hooks/useAudioDevices'
import { FieldRow, FieldValue } from './FieldRow'
import { DevicePicker } from './DevicePicker'
import { Keys } from './Keys'
import { FolderIcon, KeyboardIcon } from './icons'

interface Props {
  shortcut: ShortcutState
  shortcutButton: string
  busy: boolean
  settings: Settings
  onChangeShortcut: () => void
  onChooseVault: () => void
  onChooseMic: (id: string) => void
  onChooseSpeaker: (id: string) => void
  onClose: () => void
}

// The pop-up behind the gear: the recording shortcut, the Obsidian vault, and
// which microphone and speaker Benson uses. Click outside or press Esc to close.
export function SettingsMenu({
  shortcut,
  shortcutButton,
  busy,
  settings,
  onChangeShortcut,
  onChooseVault,
  onChooseMic,
  onChooseSpeaker,
  onClose
}: Props): React.JSX.Element {
  const menu = useRef<HTMLDivElement>(null)
  const { mics, speakers } = useAudioDevices()
  const vaultName = noteName(settings.vaultPath)
  // While you set the shortcut, the keys show up as you press them.
  const keys = shownKeys(shortcut)

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent): void {
      if (!menu.current?.contains(event.target as Node)) onClose()
    }
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div ref={menu} className="settings" role="dialog" aria-label="Settings">
      <section className="setting">
        <h3>Recording shortcut</h3>
        <FieldRow
          button={shortcutButton}
          icon={KeyboardIcon}
          disabled={busy || shortcut.saving}
          onClick={onChangeShortcut}
        >
          <FieldValue>
            {keys ? (
              <Keys label={keys} />
            ) : (
              <span className="field-hint">
                {shortcut.listening ? 'Press keys, or Esc to cancel' : 'Not set'}
              </span>
            )}
          </FieldValue>
        </FieldRow>
      </section>

      <section className="setting">
        <h3>Obsidian vault</h3>
        <FieldRow button="Choose..." icon={FolderIcon} disabled={busy} onClick={onChooseVault}>
          <FieldValue title={settings.vaultPath}>{vaultName}</FieldValue>
        </FieldRow>
      </section>

      <section className="setting">
        <h3>
          <label htmlFor="mic">Microphone</label>
        </h3>
        <DevicePicker id="mic" devices={mics} value={settings.micId} onChange={onChooseMic} />
      </section>

      <section className="setting">
        <h3>
          <label htmlFor="speaker">Speaker</label>
        </h3>
        <DevicePicker
          id="speaker"
          devices={speakers}
          value={settings.speakerId}
          onChange={onChooseSpeaker}
        />
      </section>
    </div>
  )
}
