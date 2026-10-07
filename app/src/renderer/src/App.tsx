import { useEffect, useRef, useState } from 'react'
import type { SavedRecording } from '../../recording'
import type { NoteDraft } from '../../noteDraft'
import type { ShortcutState } from '../../shortcut'

function App(): React.JSX.Element {
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<SavedRecording[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [sentMessage, setSentMessage] = useState('')
  const [prompt, setPrompt] = useState(
    'Classify this transcript as Task, Idea, Reference, Journal, or Unclear. Suggest an existing note to add it to, or a new note if none fits. Prepare the note text and give one short reason. Ask a question if the request is unclear.'
  )
  const [draft, setDraft] = useState<NoteDraft | null>(null)
  const sendingRef = useRef(false)
  const [qwenError, setQwenError] = useState('')
  const [shortcut, setShortcut] = useState<ShortcutState>({
    label: 'Not set',
    listening: false,
    saving: false,
    error: null
  })

  // The recorder lives here so it survives between renders.
  const recorderRef = useRef<MediaRecorder | null>(null)
  const busyRef = useRef(false)
  const waitingForMicRef = useRef(false)
  const shortcutHeldRef = useRef(false)
  const startedByShortcutRef = useRef(false)
  const stopRequestedRef = useRef(false)
  const shortcutHandlerRef = useRef<(down: boolean) => void>(() => {})

  function setWorking(value: boolean): void {
    // Update this right away so quick key presses cannot start two recordings.
    busyRef.current = value
    setBusy(value)
  }

  // Find the saved entry for the recording on screen.
  const selected = history.find((item) => item.audio_path === savedPath)
  const changingShortcut = shortcut.listening || shortcut.saving
  let shortcutButtonText = shortcut.label === 'Not set' ? 'Set shortcut' : 'Change shortcut'
  if (shortcut.listening) shortcutButtonText = 'Cancel'
  if (shortcut.saving) shortcutButtonText = 'Saving…'

  function loadHistory(): Promise<void> {
    return window.api
      .getRecordings()
      .then((recordings) => {
        setHistory(recordings)
        setHistoryError(null)
      })
      .catch(() => {
        setHistoryError('Could not load your recordings. Try again.')
      })
      .finally(() => {
        setHistoryLoading(false)
      })
  }

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    let mounted = true
    window.api
      .getRecordingShortcut()
      .then((state) => {
        if (mounted) setShortcut(state)
      })
      .catch(() => {
        if (mounted)
          setShortcut((state) => ({ ...state, error: 'Could not load the recording shortcut.' }))
      })
    const offState = window.api.onShortcutState(setShortcut)
    const offShortcut = window.api.onRecordingShortcut((down) => shortcutHandlerRef.current(down))
    return () => {
      mounted = false
      offState()
      offShortcut()
      const recorder = recorderRef.current
      if (recorder) {
        recorder.onstop = null
        if (recorder.state === 'recording') recorder.stop()
        recorder.stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Use the latest prompt without adding another shortcut listener.
  useEffect(() => {
    shortcutHandlerRef.current = (down) => {
      shortcutHeldRef.current = down
      if (down) {
        if (busyRef.current || recorderRef.current || changingShortcut) return
        if (!prompt.trim()) {
          setError('Enter a Qwen prompt before recording.')
          window.api.showReview()
          return
        }
        void startRecording(true)
      } else if (startedByShortcutRef.current) {
        stopRecording()
      }
    }
  })

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  async function processRecording(blob: Blob): Promise<void> {
    const showReview = startedByShortcutRef.current
    startedByShortcutRef.current = false
    setWorking(true)
    window.api.setRecordingActivity('processing')
    setTranscript(null)
    setSavedPath(null)
    setAudioUrl(URL.createObjectURL(blob))

    try {
      const bytes = await blob.arrayBuffer()
      const path = await window.api.saveRecording(bytes)
      setSavedPath(path)

      const text = await window.api.transcribeRecording(path)
      setTranscript(text)
      if (!text.trim()) throw new Error('No speech was found in the recording.')

      await prepareDraft(text)
    } catch (error) {
      setError(`Could not save or transcribe the recording: ${String(error)}`)
    } finally {
      await loadHistory()
      setWorking(false)
      window.api.setRecordingActivity('idle')
      if (showReview) window.api.showReview()
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
      setHistory((items) =>
        items.map((item) =>
          item.id === selected.id ? { ...item, sent_at: new Date().toISOString() } : item
        )
      )
      await loadHistory()
    } catch (error) {
      setError(`Could not send the draft: ${String(error)}`)
    } finally {
      sendingRef.current = false
      setWorking(false)
    }
  }

  async function openRecording(recording: SavedRecording): Promise<void> {
    setDraft(null)
    setQwenError('')
    setWorking(true)
    setError(null)
    setSentMessage('')
    setSavedPath(recording.audio_path)
    setTranscript(recording.transcript)
    setAudioUrl(null)

    try {
      const bytes = await window.api.readRecording(recording.id)
      const blob = new Blob([bytes], { type: 'audio/webm' })
      setAudioUrl(URL.createObjectURL(blob))
    } catch {
      setError('Could not open the audio. The file may have been moved or removed.')
    } finally {
      setWorking(false)
    }
  }

  async function startRecording(fromShortcut = false): Promise<void> {
    if (busyRef.current || waitingForMicRef.current || recorderRef.current) return
    waitingForMicRef.current = true
    startedByShortcutRef.current = fromShortcut
    stopRequestedRef.current = false
    setDraft(null)
    setQwenError('')
    setError(null)
    setSentMessage('')
    setWorking(true)
    window.api.setRecordingActivity('starting')
    // Close the old player before recording a new clip.
    setAudioUrl(null)
    setSavedPath(null)
    setTranscript(null)
    let mic: MediaStream | null = null
    try {
      // Ask for the mic. Mac will ask for permission the first time.
      mic = await navigator.mediaDevices.getUserMedia({ audio: true })
      // The key may be released while the microphone permission window is open.
      if (stopRequestedRef.current || (fromShortcut && !shortcutHeldRef.current)) {
        mic.getTracks().forEach((track) => track.stop())
        startedByShortcutRef.current = false
        window.api.setRecordingActivity('idle')
        return
      }
      const recorder = new MediaRecorder(mic)
      const chunks: Blob[] = []
      let failed = false

      // Audio comes in pieces while recording, so collect them.
      recorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      // Once stopped, combine the pieces into one clip and hand it to the player.
      recorder.onstop = async () => {
        // Turn the mic off now that we are done with it.
        recorder.stream.getTracks().forEach((track) => track.stop())
        recorderRef.current = null
        if (failed) return

        const blob = new Blob(chunks, { type: 'audio/webm' })
        await processRecording(blob)
      }

      recorder.onerror = () => {
        failed = true
        recorder.stream.getTracks().forEach((track) => track.stop())
        recorderRef.current = null
        startedByShortcutRef.current = false
        setRecording(false)
        setWorking(false)
        setError('Microphone stopped. Try recording again.')
        window.api.setRecordingActivity('idle')
        if (fromShortcut) window.api.showReview()
      }

      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      window.api.setRecordingActivity('recording')
    } catch (error) {
      mic?.getTracks().forEach((track) => track.stop())
      recorderRef.current = null
      startedByShortcutRef.current = false
      setError(`Could not start recording: ${String(error)}`)
      window.api.setRecordingActivity('idle')
      if (fromShortcut) window.api.showReview()
    } finally {
      waitingForMicRef.current = false
      setWorking(false)
    }
  }

  function stopRecording(): void {
    stopRequestedRef.current = true
    if (waitingForMicRef.current || recorderRef.current?.state !== 'recording') return
    setWorking(true)
    window.api.setRecordingActivity('processing')
    recorderRef.current.stop()
    setRecording(false)
  }

  function toggleRecording(): void {
    if (recording) stopRecording()
    else void startRecording()
  }

  async function changeShortcut(): Promise<void> {
    try {
      if (shortcut.listening) await window.api.cancelShortcutCapture()
      else await window.api.beginShortcutCapture()
    } catch (error) {
      setShortcut((state) => ({ ...state, error: String(error) }))
    }
  }

  return (
    <main>
      <h1>Benson</h1>
      <section aria-label="Recording shortcut" className="shortcut-settings">
        <div className="shortcut-controls">
          <strong>Shortcut</strong>
          <p role="status">{shortcut.listening ? 'Press keys…' : shortcut.label}</p>
          <button disabled={busy || recording || shortcut.saving} onClick={changeShortcut}>
            {shortcutButtonText}
          </button>
        </div>
        <p className="shortcut-help">
          {shortcut.listening
            ? 'Press a shortcut. Esc cancels.'
            : 'Hold to record. Release to finish.'}
        </p>
        {shortcut.error && <p role="alert">{shortcut.error}</p>}
      </section>
      <label htmlFor="qwen-prompt">Qwen prompt</label>
      <textarea
        id="qwen-prompt"
        rows={4}
        value={prompt}
        disabled={busy || recording || changingShortcut}
        onChange={(event) => {
          setPrompt(event.target.value)
          setDraft(null)
        }}
      />
      <p>Review your note, then Send to Obsidian.</p>
      <button
        disabled={busy || changingShortcut || (!recording && !prompt.trim())}
        onClick={toggleRecording}
      >
        {recording ? 'Stop recording' : 'Record'}
      </button>
      {recording && <p role="status">Recording...</p>}
      {busy && <p role="status">Working...</p>}
      {error && <p role="alert">{error}</p>}

      {(audioUrl || savedPath) && (
        <section aria-label="Selected recording">
          {audioUrl && <audio controls src={audioUrl} aria-label="Recording playback" />}
          <h2>Transcript</h2>
          {transcript ? (
            <p className="transcript">{transcript}</p>
          ) : (
            !busy && <p>No transcript available.</p>
          )}
          {selected?.transcript && !selected.sent_at && !draft && (
            <button
              disabled={busy || recording || !prompt.trim()}
              onClick={async () => {
                setWorking(true)
                setError(null)
                setSentMessage('')
                await prepareDraft(selected.transcript!)
                setWorking(false)
              }}
            >
              {qwenError ? 'Retry draft' : 'Prepare draft'}
            </button>
          )}
          {sentMessage && <p role="status">{sentMessage}</p>}
          {selected?.sent_at && <p>This recording has been sent to Obsidian.</p>}
          {qwenError && <p role="alert">{qwenError}</p>}
          {draft && (
            <section aria-labelledby="draft-heading">
              <h2 id="draft-heading">Review note draft</h2>
              <p>Category: {draft.category}</p>
              <p>{draft.explanation}</p>
              {draft.action === 'clarify' ? (
                <p>Clarify your request in the Qwen prompt, then prepare another draft.</p>
              ) : (
                <>
                  <p>
                    Action: {draft.action === 'create' ? 'Create a new note' : 'Append to a note'}
                  </p>
                  <label htmlFor="note-path">Destination</label>
                  <input
                    id="note-path"
                    value={draft.path}
                    disabled={busy}
                    onChange={(event) => setDraft({ ...draft, path: event.target.value })}
                  />
                  <label htmlFor="note-content">Note text</label>
                  <textarea
                    id="note-content"
                    rows={6}
                    value={draft.content}
                    disabled={busy}
                    onChange={(event) => setDraft({ ...draft, content: event.target.value })}
                  />
                  <button
                    disabled={
                      busy ||
                      !selected ||
                      !!selected.sent_at ||
                      !draft.path.trim() ||
                      !draft.content.trim()
                    }
                    onClick={sendDraft}
                  >
                    Send
                  </button>{' '}
                </>
              )}
              <button
                disabled={busy}
                onClick={() => {
                  setDraft(null)
                  setError(null)
                  setSentMessage('Draft cancelled. Your recording is still saved.')
                }}
              >
                Cancel
              </button>
            </section>
          )}
        </section>
      )}

      <section aria-labelledby="history-heading">
        <h2 id="history-heading">History</h2>
        {historyLoading && <p role="status">Loading recordings...</p>}
        {historyError && (
          <div>
            <p role="alert">{historyError}</p>
            <button disabled={busy || recording} onClick={loadHistory}>
              Try again
            </button>
          </div>
        )}
        {!historyLoading && !historyError && history.length === 0 && (
          <p>Your recordings will appear here.</p>
        )}
        <ul>
          {history.map((item) => (
            <li key={item.id}>
              <button
                disabled={busy || recording}
                aria-pressed={savedPath === item.audio_path}
                onClick={() => openRecording(item)}
              >
                {new Date(item.created_at).toLocaleString()}
              </button>{' '}
              {item.transcript ? item.transcript.slice(0, 100) : 'No transcript available'}
              {item.sent_at && (
                <p>Last sent to Obsidian: {new Date(item.sent_at).toLocaleString()}</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
