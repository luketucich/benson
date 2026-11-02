import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'

// Where Ollama is usually installed. Apps opened from Finder don't get the
// terminal's PATH, so look in these first.
const installPaths = [
  '/opt/homebrew/bin/ollama',
  '/usr/local/bin/ollama',
  '/Applications/Ollama.app/Contents/Resources/ollama'
]

// Only set when Benson started Ollama itself.
let server: ChildProcess | null = null

async function isRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/version', {
      signal: AbortSignal.timeout(1000)
    })
    return response.ok
  } catch {
    return false
  }
}

// Start Ollama if it isn't already running, so drafts work without a terminal.
// Ollama loads Qwen by itself on the first request.
export async function startOllama(): Promise<void> {
  if (await isRunning()) return

  const program = installPaths.find((path) => existsSync(path)) ?? 'ollama'
  const child = spawn(program, ['serve'], { stdio: 'ignore' })
  server = child

  child.once('error', (error) => console.error('Could not start Ollama. Is it installed?', error))
  child.once('exit', () => {
    if (server === child) server = null
  })
}

// Stop Ollama only if Benson started it. One the user started keeps running.
export function stopOllama(): void {
  server?.kill()
  server = null
}
