import { useEffect, useRef, useState } from 'react'
import type { NoteDraft } from '../../noteDraft'
import type { SavedRecording } from '../../recording'
import { useHistory } from './hooks/useHistory'
import { useRecorder } from './hooks/useRecorder'
import { useShortcut } from './hooks/useShortcut'
import { Alert, Status } from './components/Message'
import { DraftReview } from './components/DraftReview'
import { HistoryList } from './components/HistoryList'
import { SelectedRecording } from './components/SelectedRecording'
import { ShortcutSettings } from './components/ShortcutSettings'

const defaultPrompt =
  'Classify this transcript as Task, Idea, Reference, Journal, or Unclear. Suggest an existing note to add it to, or a new note if none fits. Prepare the note text and give one short reason. Ask a question if the request is unclear.'

function App(): React.JSX.Element {
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [draft, setDraft] = useState<NoteDraft | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentMessage, setSentMessage] = useState('')
  const [qwenError, setQwenError] = useState('')
  const sendingRef = useRef(false)

  const history = useHistory()
  const recorder = useRecorder({ onClip: handleClip, onError: handleRecorderError })
  const shortcut = useShortcut(handleHold)

  const busy = working || recorder.busy
  const selected = history.items.find((item) => item.audio_path === savedPath)

  // Release the old player's memory when the clip changes.
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  function clearMessages(): void {
    setDraft(null)
    setQwenError('')
    setError(null)
    setSentMessage('')
  }

  function handleHold(down: boolean): void {
    recorder.setHeld(down)
    if (!down) {
      if (recorder.startedByShortcut()) recorder.stop()
      return
    }
    if (busy || recorder.recording || shortcut.changing) return
    if (!prompt.trim()) {
      setError('Enter a Qwen prompt before recording.')
      window.api.showReview()
      return
    }
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
    setWorking(true)
    window.api.setRecordingActivity('processing')
    setTranscript(null)
    setSavedPath(null)
    setAudioUrl(URL.createObjectURL(blob))

    try {
      const path = await window.api.saveRecording(await blob.arrayBuffer())
      setSavedPath(path)

      const text = await window.api.transcribeRecording(path)
      setTranscript(text)
      if (!text.trim()) throw new Error('No speech was found in the recording.')

      await prepareDraft(text)
    } catch (problem) {
      setError(`Could not save or transcribe the recording: ${String(problem)}`)
    } finally {
      await history.reload()
      setWorking(false)
      window.api.setRecordingActivity('idle')
      if (fromShortcut) window.api.showReview()
    }
  }

  async function prepareDraft(text: string): Promise<void> {
    setDraft(null)
    setQwenError('')
    try {
      setDraft(await window.api.askQwen(prompt, text))
    } catch {
      setQwenError(
        'Could not prepare a draft. Check that Ollama is running and the vault is available, then try again.'
      )
    }
  }

  async function sendDraft(): Promise<void> {
    if (!selected || !draft || draft.action === 'clarify' || sendingRef.current) return
    sendingRef.current = true
    setWorking(true)
    setError(null)
    setSentMessage('')

    try {
      await window.api.saveApprovedDraft(selected.id, draft)
      setDraft(null)
      setSentMessage(`Sent to ${draft.path}.`)
      await history.reload()
    } catch (problem) {
      setError(`Could not send the draft: ${String(problem)}`)
    } finally {
      sendingRef.current = false
      setWorking(false)
    }
  }

  async function openRecording(recording: SavedRecording): Promise<void> {
    clearMessages()
    setWorking(true)
    setSavedPath(recording.audio_path)
    setTranscript(recording.transcript)
    setAudioUrl(null)

    try {
      const bytes = await window.api.readRecording(recording.id)
      setAudioUrl(URL.createObjectURL(new Blob([bytes], { type: 'audio/webm' })))
    } catch {
      setError('Could not open the audio. The file may have been moved or removed.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <main>
      <h1>Benson</h1>

      <ShortcutSettings
        state={shortcut.state}
        buttonText={shortcut.buttonText}
        disabled={busy || recorder.recording || shortcut.state.saving}
        onChange={shortcut.change}
      />

      <label htmlFor="qwen-prompt">Qwen prompt</label>
      <textarea
        id="qwen-prompt"
        rows={4}
        value={prompt}
        disabled={busy || recorder.recording || shortcut.changing}
        onChange={(event) => {
          setPrompt(event.target.value)
          setDraft(null)
        }}
      />

      <p>Review your note, then Send to Obsidian.</p>
      <button
        disabled={busy || shortcut.changing || (!recorder.recording && !prompt.trim())}
        onClick={toggleRecording}
      >
        {recorder.recording ? 'Stop recording' : 'Record'}
      </button>
      {recorder.recording && <Status>Recording…</Status>}
      {busy && <Status>Working…</Status>}
      {error && <Alert>{error}</Alert>}

      {(audioUrl || savedPath) && (
        <SelectedRecording
          audioUrl={audioUrl}
          transcript={transcript}
          busy={busy}
          showPrepare={Boolean(selected?.transcript && !selected.sent_at && !draft)}
          prepareLabel={qwenError ? 'Retry draft' : 'Prepare draft'}
          prepareDisabled={busy || recorder.recording || !prompt.trim()}
          onPrepare={async () => {
            setWorking(true)
            setError(null)
            setSentMessage('')
            await prepareDraft(selected?.transcript ?? '')
            setWorking(false)
          }}
        >
          {sentMessage && <Status>{sentMessage}</Status>}
          {selected?.sent_at && <p>This recording has been sent to Obsidian.</p>}
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
                setSentMessage('Draft cancelled. Your recording is still saved.')
              }}
            />
          )}
        </SelectedRecording>
      )}

      <HistoryList
        items={history.items}
        loading={history.loading}
        error={history.error}
        disabled={busy || recorder.recording}
        selectedPath={savedPath}
        onOpen={openRecording}
        onRetry={history.reload}
      />
    </main>
  )
}

export default App
