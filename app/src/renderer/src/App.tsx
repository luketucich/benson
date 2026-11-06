import { useEffect, useRef, useState } from 'react'
import type { NoteDraft } from '../../noteDraft'
import type { SavedRecording } from '../../recording'
import { unsetShortcut } from '../../shortcut'
import { useHistory } from './hooks/useHistory'
import { useRecorder } from './hooks/useRecorder'
import { useShortcut } from './hooks/useShortcut'
import { Alert, Status, Working } from './components/Message'
import { DraftReview } from './components/DraftReview'
import { EmptyState } from './components/EmptyState'
import { HistoryList } from './components/HistoryList'
import { RecordingView } from './components/RecordingView'
import { SelectedRecording } from './components/SelectedRecording'
import { SentNote } from './components/SentNote'
import { ShortcutSettings } from './components/ShortcutSettings'
import { playSentSound, playStartSound, playStopSound } from './sounds'

function App(): React.JSX.Element {
  const [draft, setDraft] = useState<NoteDraft | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  // What Benson is doing right now, shown to the user. Empty when idle.
  const [step, setStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [sentPath, setSentPath] = useState<string | null>(null)
  const [qwenError, setQwenError] = useState('')
  const sendingRef = useRef(false)
  const wasRecordingRef = useRef(false)

  const history = useHistory()
  const recorder = useRecorder({ onClip: handleClip, onError: handleRecorderError })
  const shortcut = useShortcut(handleHold)

  const busy = Boolean(step) || recorder.busy
  const selected = history.items.find((item) => item.audio_path === savedPath)

  // Release the old player's memory when the clip changes.
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  // A rising sound when the microphone turns on, falling when it turns off.
  useEffect(() => {
    if (recorder.recording === wasRecordingRef.current) return
    wasRecordingRef.current = recorder.recording
    if (recorder.recording) playStartSound()
    else playStopSound()
  }, [recorder.recording])

  function clearMessages(): void {
    setDraft(null)
    setQwenError('')
    setError(null)
    setNotice('')
    setSentPath(null)
  }

  function handleHold(down: boolean): void {
    recorder.setHeld(down)
    if (!down) {
      if (recorder.startedByShortcut()) recorder.stop()
      return
    }
    if (busy || recorder.recording || shortcut.changing) return
    clearMessages()
    void recorder.start(true)
  }

  function handleRecorderError(message: string, fromShortcut: boolean): void {
    setError(message)
    if (fromShortcut) window.api.showReview()
  }

  function toggleRecording(): void {
    if (!recorder.recording) clearMessages()
    recorder.toggle()
  }

  async function handleClip(blob: Blob, fromShortcut: boolean): Promise<void> {
    setStep('Saving your recording...')
    window.api.setRecordingActivity('processing')
    setTranscript(null)
    setSavedPath(null)
    setAudioUrl(URL.createObjectURL(blob))

    try {
      const path = await window.api.saveRecording(await blob.arrayBuffer())
      setSavedPath(path)

      setStep('Turning speech into text...')
      const text = await window.api.transcribeRecording(path)
      setTranscript(text)
      if (!text.trim()) {
        setError('Benson didn’t hear anything. Try recording again.')
        return
      }

      setStep('Writing your note...')
      await prepareDraft(text)
    } catch (problem) {
      setError(`Could not save or transcribe the recording: ${String(problem)}`)
    } finally {
      await history.reload()
      setStep('')
      window.api.setRecordingActivity('idle')
      if (fromShortcut) window.api.showReview()
    }
  }

  async function prepareDraft(text: string): Promise<void> {
    setDraft(null)
    setQwenError('')
    try {
      setDraft(await window.api.askQwen(text))
    } catch {
      setQwenError(
        'Could not write a note. Check that Ollama is installed and the vault is available, then try again.'
      )
    }
  }

  async function sendDraft(): Promise<void> {
    if (!selected || !draft || draft.action === 'clarify' || sendingRef.current) return
    sendingRef.current = true
    setStep('Saving to Obsidian...')
    setError(null)
    setNotice('')

    try {
      await window.api.saveApprovedDraft(selected.id, draft)
      setDraft(null)
      setSentPath(draft.path)
      playSentSound()
      await history.reload()
    } catch (problem) {
      setError(`Could not save the note: ${String(problem)}`)
    } finally {
      sendingRef.current = false
      setStep('')
    }
  }

  async function openRecording(recording: SavedRecording): Promise<void> {
    clearMessages()
    setStep('Opening...')
    setSavedPath(recording.audio_path)
    setTranscript(recording.transcript)
    setAudioUrl(null)

    try {
      const bytes = await window.api.readRecording(recording.id)
      setAudioUrl(URL.createObjectURL(new Blob([bytes], { type: 'audio/webm' })))
    } catch {
      setError('Could not open the audio. The file may have been moved or removed.')
    } finally {
      setStep('')
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-top">
          <p className="wordmark">Benson</p>
          <button
            className="record-button"
            aria-pressed={recorder.recording}
            disabled={busy || shortcut.changing}
            onClick={toggleRecording}
          >
            <span className="record-dot" aria-hidden="true" />
            {recorder.recording ? 'Stop' : 'Record'}
          </button>
        </div>

        <HistoryList
          items={history.items}
          loading={history.loading}
          error={history.error}
          disabled={busy || recorder.recording}
          selectedPath={savedPath}
          onOpen={openRecording}
          onRetry={history.reload}
        />

        <div className="sidebar-footer">
          <ShortcutSettings
            state={shortcut.state}
            buttonText={shortcut.buttonText}
            disabled={busy || recorder.recording || shortcut.state.saving}
            onChange={shortcut.change}
          />
        </div>
      </aside>

      <main className="content">
        {recorder.recording ? (
          <RecordingView fromShortcut={recorder.startedByShortcut()} />
        ) : (
          <>
            {audioUrl || savedPath ? (
              <SelectedRecording
                key={savedPath ?? 'new'}
                createdAt={selected?.created_at ?? null}
                audioUrl={audioUrl}
                transcript={transcript}
                busy={busy}
                showPrepare={Boolean(selected?.transcript && !selected.sent_at && !draft && !step)}
                prepareLabel={qwenError ? 'Try again' : 'Write a note'}
                prepareDisabled={busy || recorder.recording}
                onPrepare={async () => {
                  setStep('Writing your note...')
                  setError(null)
                  setNotice('')
                  await prepareDraft(selected?.transcript ?? '')
                  setStep('')
                }}
              >
                {step && <Working>{step}</Working>}
                {error && <Alert>{error}</Alert>}
                {notice && <Status>{notice}</Status>}
                {selected?.sent_at && <SentNote path={sentPath} sentAt={selected.sent_at} />}
                {qwenError && <Alert>{qwenError}</Alert>}
                {draft && (
                  <DraftReview
                    draft={draft}
                    disabled={busy}
                    canSend={
                      !busy &&
                      Boolean(selected && !selected.sent_at) &&
                      Boolean(draft.path.trim() && draft.content.trim())
                    }
                    onChange={setDraft}
                    onSend={sendDraft}
                    onCancel={() => {
                      setDraft(null)
                      setError(null)
                      setNotice('Note discarded. Your recording is still saved.')
                    }}
                  />
                )}
              </SelectedRecording>
            ) : error ? (
              <Alert>{error}</Alert>
            ) : (
              !busy && (
                <EmptyState
                  shortcut={
                    shortcut.state.label === unsetShortcut.label ? null : shortcut.state.label
                  }
                />
              )
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
