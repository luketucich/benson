/// <reference types="vite/client" />

// Chromium can send Web Audio to a chosen speaker, but TypeScript doesn't list it yet.
interface AudioContext {
  readonly sinkId: string | object
  setSinkId(id: string): Promise<void>
}
