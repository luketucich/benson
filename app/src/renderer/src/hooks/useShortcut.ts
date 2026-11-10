import { useEffect, useRef, useState } from 'react'
import { unsetShortcut, type ShortcutState } from '../../../shortcut'
import { errorText, useToast } from '../toast'
import { useEventCallback } from './useEventCallback'

// What useShortcut gives back, for components that show or change the shortcut.
export type ShortcutControls = ReturnType<typeof useShortcut>

// Holds the recording shortcut's settings and reports when the key is held.
// A toast says when a new shortcut is set, or when something goes wrong.
export function useShortcut(onHold: (down: boolean) => void): {
  state: ShortcutState
  changing: boolean
  buttonText: string
  change: () => Promise<void>
} {
  const [state, setState] = useState<ShortcutState>(unsetShortcut)
  const previous = useRef(unsetShortcut)
  const hold = useEventCallback(onHold)
  const toast = useToast()

  const update = useEventCallback((next: ShortcutState) => {
    const before = previous.current
    previous.current = next
    setState(next)
    if (next.error && next.error !== before.error) toast(next.error, 'error')
    const justSet = before.saving && !next.saving && next.label !== before.label
    if (justSet && !next.error) toast(`Shortcut set to ${next.label}`)
  })

  useEffect(() => {
    let active = true
    window.api
      .getRecordingShortcut()
      .then((saved) => {
        if (active) update(saved)
      })
      .catch(() => {
        if (active) toast('I couldn’t load your recording shortcut.', 'error')
      })

    const offState = window.api.onShortcutState(update)
    const offHold = window.api.onRecordingShortcut(hold)
    return () => {
      active = false
      offState()
      offHold()
    }
  }, [hold, update, toast])

  async function change(): Promise<void> {
    try {
      if (state.listening) await window.api.cancelShortcutCapture()
      else await window.api.beginShortcutCapture()
    } catch (error) {
      toast(errorText(error), 'error')
    }
  }

  let buttonText = state.label ? 'Change' : 'Set shortcut'
  if (state.listening) buttonText = 'Cancel'
  if (state.saving) buttonText = 'Saving...'

  return { state, changing: state.listening || state.saving, buttonText, change }
}
