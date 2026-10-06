import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

if (process.platform === 'darwin') {
  const resources = fileURLToPath(new URL('../resources/', import.meta.url))
  mkdirSync(resources, { recursive: true })
  execFileSync(
    'xcrun',
    [
      'clang',
      '-O2',
      '-Wall',
      '-Wextra',
      '-framework',
      'Carbon',
      '-framework',
      'AppKit',
      fileURLToPath(new URL('../native/recording-hotkey.m', import.meta.url)),
      '-o',
      resources + 'recording-hotkey'
    ],
    { stdio: 'inherit' }
  )
}
