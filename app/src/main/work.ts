// Benson works on one thing at a time: turning speech into text, or writing
// a note. Stopping cancels whatever that is.

let controller = new AbortController()

// Hand this to the slow step, so stopping can cut it short.
export function workSignal(): AbortSignal {
  return controller.signal
}

// True when an error only means you pressed Stop, so it isn't a real problem.
export function wasStopped(error: unknown): boolean {
  return (error as Error)?.name === 'AbortError'
}

// Cancels the current step. The next one starts fresh.
export function stopWork(): void {
  controller.abort()
  controller = new AbortController()
}
