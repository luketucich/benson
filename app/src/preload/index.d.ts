import type { SavedRecording } from '../recording'
import type { NoteDraft } from '../noteDraft'
import type { ShortcutState, RecordingActivity } from '../shortcut'
import type { PanelAction, PanelStatus } from '../panel'
import type { Settings } from '../settings'
import type { PieceStatus, SetupState } from '../setup'

// This file only tells TypeScript what preload/index.ts adds to window.
// It does not run code. Promise<string> means the text arrives asynchronously.
declare global {
  interface Window {
    api: {
      saveRecording(bytes: ArrayBuffer): Promise<{ id: number; path: string }>
      transcribeRecording(filePath: string): Promise<string>
      getRecordings(): Promise<SavedRecording[]>
      readAudio(path: string): Promise<ArrayBuffer>
      chooseNote(current: string): Promise<{ path: string; action: 'append' | 'create' } | null>
      deleteRecording(id: number): Promise<void>
      showRecordingMenu(): Promise<'delete' | null>
      // Benson's answer, and the last thing you said (for the panel).
      writeNote(id: number): Promise<{ draft: NoteDraft; said: string }>
      addReply(id: number, text: string): Promise<void>
      addVoiceReply(id: number, bytes: ArrayBuffer): Promise<void>
      saveNote(id: number, draft: NoteDraft): Promise<NoteDraft>
      discardNote(id: number): Promise<void>
      // Stops Benson transcribing or writing a note.
      stopWork(): void
      // Onboarding: check what's installed, install the rest, and finish.
      getSetup(): Promise<SetupState>
      runSetup(): Promise<void>
      finishSetup(): Promise<void>
      // Makes ~/Documents/Benson Vault and switches to it.
      makeVault(): Promise<Settings>
      micAccess(): Promise<'granted' | 'denied' | 'not-determined' | 'restricted' | 'unknown'>
      askMicAccess(): Promise<boolean>
      openMicSettings(): Promise<void>
      // Sets the shortcut to Control + Option + Space.
      useSuggestedShortcut(): Promise<void>
      // Brings the main window to the front.
      showWindow(): void
      onSetupProgress(listener: (pieces: PieceStatus[]) => void): () => void
      getSettings(): Promise<Settings>
      saveDevices(micId: string, speakerId: string): Promise<Settings>
      chooseVault(): Promise<Settings | null>
      getRecordingShortcut(): Promise<ShortcutState>
      beginShortcutCapture(): Promise<void>
      cancelShortcutCapture(): Promise<void>
      onShortcutState(listener: (state: ShortcutState) => void): () => void
      onRecordingShortcut(listener: (down: boolean) => void): () => void
      setRecordingActivity(activity: RecordingActivity): void
      setPanelStatus(status: PanelStatus | null): void
      getPanelStatus(): Promise<PanelStatus | null>
      onPanelStatus(listener: (status: PanelStatus | null) => void): () => void
      openFromPanel(): void
      closePanel(): void
      resizePanel(height: number): void
      panelAction(action: PanelAction): void
      onPanelAction(listener: (action: PanelAction) => void): () => void
    }
  }
}
