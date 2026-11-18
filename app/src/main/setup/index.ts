import { getSettings, saveSettings } from '../settings'
import { dev } from '../dev'
import { pieces } from './pieces'
import type { PieceStatus, SetupState } from '../../setup'

let statuses: PieceStatus[] = []
let running: Promise<void> | null = null

// Looks at every piece again.
async function refresh(): Promise<void> {
  statuses = await Promise.all(
    pieces.map(async ({ id, name, isReady }) => ({
      id,
      name,
      state: (await isReady()) ? ('ready' as const) : ('missing' as const)
    }))
  )
}

// Set once onboarding is finished, so the developer switch stops showing it.
let finishedNow = false

// Onboarding shows until it's finished once.
export function onboardingShowing(): boolean {
  return !getSettings().setupDone || (dev.showOnboarding && !finishedNow)
}

export function finishOnboarding(): void {
  finishedNow = true
  saveSettings({ setupDone: true })
}

// Checks every piece without changing anything. While installing, it just
// reports how that's going.
export async function checkSetup(): Promise<SetupState> {
  if (!running) await refresh()
  return { onboarding: onboardingShowing(), pieces: statuses }
}

// Installs whatever is missing, one at a time, telling onChange as it goes.
// A failure stops there, so Try again picks up at that piece.
export function runSetup(onChange: (pieces: PieceStatus[]) => void): Promise<void> {
  running ??= install(onChange).finally(() => (running = null))
  return running
}

async function install(onChange: (pieces: PieceStatus[]) => void): Promise<void> {
  // Look again first: after "Quit Ollama and press Try again", Ollama is no
  // longer running, so Benson may need its own copy.
  await refresh()
  onChange(statuses)
  // Download progress arrives many times a second, but the screen only needs a
  // few updates, so progress is passed on at most every 150 ms.
  let lastSent = 0
  const update = (id: string, change: Partial<PieceStatus>, progress = false): void => {
    statuses = statuses.map((status) => (status.id === id ? { ...status, ...change } : status))
    if (progress && Date.now() - lastSent < 150) return
    lastSent = Date.now()
    onChange(statuses)
  }

  for (const piece of pieces) {
    if (statuses.find((status) => status.id === piece.id)?.state === 'ready') continue
    update(piece.id, { state: 'installing', error: undefined, done: undefined, total: undefined })
    try {
      await piece.install((done, total) =>
        update(piece.id, { done, total: total ?? undefined }, true)
      )
      update(piece.id, { state: 'ready' })
    } catch (error) {
      console.error(`Setting up ${piece.name} failed:`, error)
      update(piece.id, { state: 'failed', error: (error as Error).message })
      return
    }
  }
}
