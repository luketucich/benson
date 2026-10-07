import type { SavedRecording } from '../recording'
import type { NoteDraft } from '../noteDraft'
import type { ShortcutState, RecordingActivity } from '../shortcut'

// This file only tells TypeScript what preload/index.ts adds to window.
// It does not run code. Promise<string> means the text arrives asynchronously.
declare global {
  interface Window {
    api: {
      saveRecording(bytes: ArrayBuffer): Promise<string>
      transcribeRecording(filePath: string): Promise<string>
      getRecordings(): Promise<SavedRecording[]>
      readRecording(id: number): Promise<ArrayBuffer>
      saveApprovedDraft(id: number, draft: NoteDraft): Promise<void>
      askQwen(prompt: string, transcript: string): Promise<NoteDraft>
      getRecordingShortcut(): Promise<ShortcutState>
      beginShortcutCapture(): Promise<void>
      cancelShortcutCapture(): Promise<void>
      onShortcutState(listener: (state: ShortcutState) => void): () => void
      onRecordingShortcut(listener: (down: boolean) => void): () => void
      setRecordingActivity(activity: RecordingActivity): void
      showReview(): void
    }
  }
}
