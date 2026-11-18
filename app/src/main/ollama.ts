import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { toolsBin } from './setup/paths'

// Where Ollama listens. Benson always talks to it here.
export const ollamaAddress = 'http://127.0.0.1:11434'

// Ollama's Mac app keeps the program inside itself.
const ollamaMacApp = '/Applications/Ollama.app/Contents/Resources/ollama'

// Which Ollama to run: Benson's own copy if it had to download one (the
// user's was missing or too old), then the Mac app's, then one on the PATH.
export function ollamaProgram(): string {
  const ours = join(toolsBin(), 'ollama')
  if (existsSync(ours)) return ours
  return existsSync(ollamaMacApp) ? ollamaMacApp : 'ollama'
}

// Only set when Benson started Ollama itself.
let server: ChildProcess | null = null

export async function isRunning(): Promise<boolean> {
  return (await serverVersion()) !== null
}

// Start Ollama if it isn't already running, so drafts work without a terminal.
// Ollama loads Qwen by itself on the first request.
// Two callers at once share one start, so only one server is launched.
let starting: Promise<void> | null = null

export function startOllama(): Promise<void> {
  starting ??= start().finally(() => (starting = null))
  return starting
}

async function start(): Promise<void> {
  // Already started by Benson and still going.
  if (server && server.exitCode === null) return
  if (await isRunning()) return

  const child = spawn(ollamaProgram(), ['serve'], { stdio: 'ignore' })
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

// True when Ollama is running but Benson didn't start it.
export function runningSomeoneElsesOllama(): boolean {
  return server === null
}

// Waits for Ollama to answer after starting it. False if it never does.
export async function waitForOllama(milliseconds: number): Promise<boolean> {
  const giveUp = Date.now() + milliseconds
  while (Date.now() < giveUp) {
    if (await isRunning()) return true
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return false
}

// The running Ollama's version, or null if none answers.
export async function serverVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${ollamaAddress}/api/version`, {
      signal: AbortSignal.timeout(1000)
    })
    return ((await response.json()) as { version?: string }).version ?? null
  } catch {
    return null
  }
}

// Downloads a model through Ollama, which reports progress one line at a time.
export async function pullModel(
  name: string,
  onProgress: (done: number, total: number) => void,
  signal: AbortSignal
): Promise<void> {
  const response = await fetch(`${ollamaAddress}/api/pull`, {
    method: 'POST',
    body: JSON.stringify({ model: name, stream: true }),
    signal
  })
  if (!response.ok || !response.body) throw new Error(`Ollama couldn’t download ${name}.`)

  let leftover = ''
  for await (const chunk of response.body.pipeThrough(new TextDecoderStream())) {
    const lines = (leftover + chunk).split('\n')
    leftover = lines.pop() ?? ''
    for (const line of lines.filter(Boolean)) {
      const update = JSON.parse(line) as { error?: string; total?: number; completed?: number }
      if (update.error) throw new Error(update.error)
      if (update.total) onProgress(update.completed ?? 0, update.total)
    }
  }
}

// Starts Ollama if needed and waits for it to answer.
export async function ensureOllamaRunning(): Promise<void> {
  await startOllama()
  if (!(await waitForOllama(15000))) throw new Error('Ollama didn’t start. Try again.')
}
