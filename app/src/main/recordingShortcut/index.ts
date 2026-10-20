import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Input } from 'electron'
import type { RecordingShortcut, ShortcutState } from '../../shortcut'
import { labelFor, validateShortcut } from './keys'
import { killHelper, startHelper, stopHelper } from './helper'

let shortcut: RecordingShortcut | null = null
let settingsPath = ''
let held = false
let quitting = false
let state: ShortcutState = { label: 'Not set', listening: false, saving: false, error: null }
let onChange: ((state: ShortcutState) => void) | null = null
let onHold: ((down: boolean) => void) | null = null

function setState(patch: Partial<ShortcutState>): void {
  state = { ...state, ...patch }
  onChange?.({ ...state })
}

export function releaseRecordingShortcut(): void {
  if (!held) return
  held = false
  onHold?.(false)
}

function holdChanged(down: boolean): void {
  if (!down) {
    releaseRecordingShortcut()
    return
  }
  if (held) return
  held = true
  onHold?.(true)
}

function helperStopped(): void {
  releaseRecordingShortcut()
  setState({ error: 'Shortcut stopped. Set it again.' })
}

function listen(key: RecordingShortcut): Promise<void> {
  if (quitting) return Promise.reject(new Error('Benson is quitting.'))
  return startHelper(key, { onHold: holdChanged, onStopped: helperStopped })
}

// Write to a temporary file first so a crash cannot leave half a file behind.
function save(key: RecordingShortcut): void {
  writeFileSync(settingsPath + '.tmp', JSON.stringify(key) + '\n')
  renameSync(settingsPath + '.tmp', settingsPath)
}

export async function setupRecordingShortcut(
  dataFolder: string,
  changed: (state: ShortcutState) => void,
  pressed: (down: boolean) => void
): Promise<void> {
  settingsPath = join(dataFolder, 'recording-shortcut.json')
  quitting = false
  onChange = changed
  onHold = pressed

  try {
    shortcut = validateShortcut(JSON.parse(readFileSync(settingsPath, 'utf8')))
    state = { ...state, label: labelFor(shortcut) }
    await listen(shortcut)
  } catch (error) {
    // No saved file yet is normal on a first run.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      state = { ...state, error: (error as Error).message }
    }
  }

  setState({ saving: false })
}

export function getShortcutState(): ShortcutState {
  return { ...state }
}

export async function beginShortcutCapture(): Promise<void> {
  if (quitting || state.saving || state.listening) return
  setState({ saving: true })
  await stopHelper()
  setState({ listening: true, saving: false, error: null })
}

async function finishCapture(next: RecordingShortcut | null): Promise<void> {
  if (quitting || !state.listening) return
  setState({ listening: false, saving: true, error: null })

  try {
    if (next) {
      await listen(next)
      save(next)
      shortcut = next
      setState({ label: labelFor(next), error: null })
    } else if (shortcut) {
      await listen(shortcut)
    }
  } catch (error) {
    let message = (error as Error).message
    await stopHelper()

    // Put the old shortcut back so the user is not left without one.
    if (shortcut && !quitting) {
      try {
        await listen(shortcut)
      } catch {
        message += ' Set your shortcut again.'
      }
    }
    setState({ error: message })
  } finally {
    setState({ saving: false })
  }
}

export function cancelShortcutCapture(): Promise<void> {
  return finishCapture(null)
}

// While listening, every key press in the window picks the shortcut instead of
// reaching the page.
export function captureShortcutInput(event: Electron.Event, input: Input): void {
  if (!state.listening) return
  event.preventDefault()

  if (input.type !== 'keyDown' || input.isAutoRepeat) return
  if (input.key === 'Escape') {
    void cancelShortcutCapture()
    return
  }
  // Wait for a real key, not just the modifier being held down.
  if (/^(Control|Alt|Shift|Meta)/.test(input.code)) return

  try {
    const next = validateShortcut({
      code: input.code,
      control: input.control,
      alt: input.alt,
      shift: input.shift,
      meta: input.meta
    })
    setState({ error: null })
    void finishCapture(next)
  } catch (error) {
    setState({ error: (error as Error).message })
  }
}

export function closeRecordingShortcut(): void {
  quitting = true
  releaseRecordingShortcut()
  killHelper()
}
