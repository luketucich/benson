import { app, type Input } from 'electron'
import { spawn, type ChildProcess } from 'node:child_process'
import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import type { RecordingShortcut, ShortcutState } from '../shortcut'

// Mac key numbers from Apple's Events.h.
const keyCodes: Record<string, number> = {
  KeyA: 0,
  KeyS: 1,
  KeyD: 2,
  KeyF: 3,
  KeyH: 4,
  KeyG: 5,
  KeyZ: 6,
  KeyX: 7,
  KeyC: 8,
  KeyV: 9,
  KeyB: 11,
  KeyQ: 12,
  KeyW: 13,
  KeyE: 14,
  KeyR: 15,
  KeyY: 16,
  KeyT: 17,
  Digit1: 18,
  Digit2: 19,
  Digit3: 20,
  Digit4: 21,
  Digit6: 22,
  Digit5: 23,
  Digit9: 25,
  Digit7: 26,
  Digit8: 28,
  Digit0: 29,
  KeyO: 31,
  KeyU: 32,
  KeyI: 34,
  KeyP: 35,
  KeyL: 37,
  KeyJ: 38,
  KeyK: 40,
  KeyN: 45,
  KeyM: 46,
  Space: 49,
  F1: 122,
  F2: 120,
  F3: 99,
  F4: 118,
  F5: 96,
  F6: 97,
  F7: 98,
  F8: 100,
  F9: 101,
  F10: 109,
  F11: 103,
  F12: 111,
  ArrowLeft: 123,
  ArrowRight: 124,
  ArrowDown: 125,
  ArrowUp: 126
}

let shortcut: RecordingShortcut | null = null
let helper: ChildProcess | null = null
let settingsPath = ''
let held = false
let quitting = false
let state: ShortcutState = { label: 'Not set', listening: false, saving: false, error: null }
let onChange: ((state: ShortcutState) => void) | null = null
let onHold: ((down: boolean) => void) | null = null

function sendState(): void {
  onChange?.({ ...state })
}

function validateShortcut(value: unknown): RecordingShortcut {
  if (!value || typeof value !== 'object') throw new Error('Choose a recording shortcut.')
  const key = value as RecordingShortcut
  if (
    !Object.hasOwn(keyCodes, key.code) ||
    ![key.control, key.alt, key.shift, key.meta].every((field) => typeof field === 'boolean') ||
    (!key.control && !key.alt && !key.meta && !/^F\d+$/.test(key.code))
  ) {
    throw new Error('Try a shortcut like Control + Option + Space.')
  }
  return { code: key.code, control: key.control, alt: key.alt, shift: key.shift, meta: key.meta }
}

function labelFor(key: RecordingShortcut): string {
  return [
    key.control && 'Control',
    key.alt && 'Option',
    key.shift && 'Shift',
    key.meta && 'Command',
    key.code.replace(/^(Key|Digit)/, '').replace('Arrow', '')
  ]
    .filter(Boolean)
    .join(' + ')
}

export function releaseRecordingShortcut(): void {
  if (!held) return
  held = false
  onHold?.(false)
}

async function stopHelper(): Promise<void> {
  releaseRecordingShortcut()
  const previous = helper
  helper = null
  if (!previous || previous.exitCode !== null) return
  await new Promise<void>((resolve) => {
    previous.once('exit', () => resolve())
    previous.kill()
  })
}

async function startHelper(key: RecordingShortcut): Promise<void> {
  if (quitting) throw new Error('Benson is quitting.')
  if (process.platform !== 'darwin') throw new Error('Recording shortcuts currently work on Mac.')
  const resources = app.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked', 'resources')
    : join(app.getAppPath(), 'resources')
  const modifiers =
    (key.meta ? 256 : 0) | (key.shift ? 512 : 0) | (key.alt ? 2048 : 0) | (key.control ? 4096 : 0)
  const child = spawn(
    join(resources, 'recording-hotkey'),
    [String(keyCodes[key.code]), String(modifiers), String(process.pid)],
    {
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )
  helper = child
  let error = ''
  child.stderr!.on('data', (data) => {
    error += String(data)
  })
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error('Shortcut did not start. Restart Benson.'))
    }, 3000)
    child.once('error', () => {
      clearTimeout(timeout)
      reject(new Error('Could not start the shortcut. Rebuild Benson.'))
    })
    child.once('exit', () => {
      clearTimeout(timeout)
      if (helper === child) {
        helper = null
        releaseRecordingShortcut()
        state.error = 'Shortcut stopped. Set it again.'
        sendState()
      }
      reject(new Error(error.trim() || 'Could not set that shortcut. Try another.'))
    })
    createInterface({ input: child.stdout! }).on('line', (line) => {
      if (line === 'ready') {
        clearTimeout(timeout)
        resolve()
      } else if (helper === child && line === 'down' && !held) {
        held = true
        onHold?.(true)
      } else if (helper === child && line === 'up') {
        releaseRecordingShortcut()
      }
    })
  })
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
    state.label = labelFor(shortcut)
    state.saving = true
    await startHelper(shortcut)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') state.error = (error as Error).message
  }
  state.saving = false
  sendState()
}

export function getShortcutState(): ShortcutState {
  return { ...state }
}

export async function beginShortcutCapture(): Promise<void> {
  if (quitting || state.saving || state.listening) return
  state.saving = true
  sendState()
  await stopHelper()
  state = { ...state, listening: true, saving: false, error: null }
  sendState()
}

async function finishCapture(next: RecordingShortcut | null): Promise<void> {
  if (quitting || !state.listening) return
  state = { ...state, listening: false, saving: true, error: null }
  sendState()
  try {
    if (next) {
      await startHelper(next)
      writeFileSync(settingsPath + '.tmp', JSON.stringify(next) + '\n')
      renameSync(settingsPath + '.tmp', settingsPath)
      shortcut = next
      state.label = labelFor(next)
      state.error = null
    } else if (shortcut) {
      await startHelper(shortcut)
    }
  } catch (error) {
    state.error = (error as Error).message
    await stopHelper()
    if (shortcut && !quitting) {
      try {
        await startHelper(shortcut)
      } catch {
        state.error += ' Set your shortcut again.'
      }
    }
  } finally {
    state.saving = false
    sendState()
  }
}

export function cancelShortcutCapture(): Promise<void> {
  return finishCapture(null)
}

export function captureShortcutInput(event: Electron.Event, input: Input): void {
  if (!state.listening) return
  event.preventDefault()
  if (input.type === 'keyDown' && input.key === 'Escape') {
    void cancelShortcutCapture()
  } else if (input.type === 'keyDown' && !input.isAutoRepeat) {
    if (/^(Control|Alt|Shift|Meta)/.test(input.code)) return
    try {
      const next = validateShortcut({
        code: input.code,
        control: input.control,
        alt: input.alt,
        shift: input.shift,
        meta: input.meta
      })
      state.error = null
      void finishCapture(next)
    } catch (error) {
      state.error = (error as Error).message
    }
    sendState()
  }
}

export function closeRecordingShortcut(): void {
  quitting = true
  releaseRecordingShortcut()
  const previous = helper
  helper = null
  previous?.kill()
}
