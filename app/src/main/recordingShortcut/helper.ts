import { app } from 'electron'
import { spawn, type ChildProcess } from 'node:child_process'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import type { RecordingShortcut } from '../../shortcut'
import { keyCodeFor, modifiersFor } from './keys'

// The small Mac program that watches for the shortcut. Electron only reports a
// press, so this reports the release too.
let helper: ChildProcess | null = null

interface Listeners {
  onHold: (down: boolean) => void
  onStopped: () => void
}

function helperPath(): string {
  const folder = app.isPackaged
    ? join(process.resourcesPath, 'app.asar.unpacked', 'resources')
    : join(app.getAppPath(), 'resources')
  return join(folder, 'recording-hotkey')
}

export function startHelper(key: RecordingShortcut, listeners: Listeners): Promise<void> {
  if (process.platform !== 'darwin') {
    return Promise.reject(new Error('Recording shortcuts currently work on Mac.'))
  }

  const child = spawn(
    helperPath(),
    [String(keyCodeFor(key.code)), String(modifiersFor(key)), String(process.pid)],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
  helper = child

  let problem = ''
  child.stderr!.on('data', (data) => {
    problem += String(data)
  })

  return new Promise<void>((resolve, reject) => {
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
        listeners.onStopped()
      }
      reject(new Error(problem.trim() || 'Could not set that shortcut. Try another.'))
    })

    createInterface({ input: child.stdout! }).on('line', (line) => {
      if (line === 'ready') {
        clearTimeout(timeout)
        resolve()
      } else if (helper === child && (line === 'down' || line === 'up')) {
        listeners.onHold(line === 'down')
      }
    })
  })
}

export async function stopHelper(): Promise<void> {
  const previous = helper
  helper = null
  // A helper killed by a signal has no exit code, and waiting on one that has
  // already gone would never finish.
  if (!previous || previous.exitCode !== null || previous.signalCode !== null) return

  await new Promise<void>((resolve) => {
    previous.once('exit', () => resolve())
    previous.kill()
  })
}

export function killHelper(): void {
  const previous = helper
  helper = null
  previous?.kill()
}
