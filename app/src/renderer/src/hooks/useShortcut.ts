import { useEffect, useState } from 'react'
import type { ShortcutState } from '../../../shortcut'
import { useEventCallback } from './useEventCallback'

const unset: ShortcutState = { label: 'Not set', listening: false, saving: false, error: null }

// Holds the recording shortcut's settings and reports when the key is held.
export function useShortcut(onHold: (down: boolean) => void): {
  state: ShortcutState
  changing: boolean
  buttonText: string
  change: () => Promise<void>
} {
  const [state, setState] = useState<ShortcutState>(unset)
  const hold = useEventCallback(onHold)

  useEffect(() => {
    let active = true
    window.api
      .getRecordingShortcut()
      .then((saved) => {
        if (active) setState(saved)
      })
      .catch(() => {
        if (active) setState((old) => ({ ...old, error: 'Could not load the recording shortcut.' }))
      })

    const offState = window.api.onShortcutState(setState)
    const offHold = window.api.onRecordingShortcut(hold)
    return () => {
      active = false
      offState()
      offHold()
    }
  }, [hold])

  async function change(): Promise<void> {
    try {
      if (state.listening) await window.api.cancelShortcutCapture()
      else await window.api.beginShortcutCapture()
    } catch (error) {
      setState((old) => ({ ...old, error: String(error) }))
    }
  }

  let buttonText = state.label === 'Not set' ? 'Set shortcut' : 'Change shortcut'
  if (state.listening) buttonText = 'Cancel'
  if (state.saving) buttonText = 'Saving…'

  return { state, changing: state.listening || state.saving, buttonText, change }
}
