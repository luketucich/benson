import { useEffect, useRef, useState } from 'react'
import type { SavedRecording } from '../../recording'

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
    'Classify this transcript as Task, Idea, Reference, Journal, or Unclear. Give the category and one short reason in plain text. Do not guess if the meaning is unclear.'
  )
  const [qwenReply, setQwenReply] = useState('')
  const [qwenError, setQwenError] = useState('')

  // The recorder lives here so it survives between renders.
  const recorderRef = useRef<MediaRecorder | null>(null)

  // Find the saved entry for the recording on screen.
  const selected = history.find((item) => item.audio_path === savedPath)

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
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  async function processRecording(blob: Blob): Promise<void> {
    setBusy(true)
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

      try {
        const recordings = await window.api.getRecordings()
        const saved = recordings.find((item) => item.audio_path === path)
        if (!saved) throw new Error('Recording not found.')
        await window.api.sendToObsidian(saved.id)
        setSentMessage('Sent to Benson Inbox in Obsidian.')
      } catch {
        setError(
          'Recording saved, but it could not be sent to Obsidian. Use Send to Obsidian to retry.'
        )
      }

      // Still ask Qwen if sending to Obsidian fails.
      await classifyTranscript(text)
    } catch (error) {
      setError(`Could not save or transcribe the recording: ${String(error)}`)
    } finally {
      await loadHistory()
      setBusy(false)
    }
  }

  async function classifyTranscript(text: string): Promise<void> {
    setQwenReply('')
    setQwenError('')
    try {
      setQwenReply(await window.api.askQwen(prompt, text))
    } catch {
      setQwenError(
        'Could not classify the transcript. Check that Ollama is running, then try again.'
      )
    }
  }

  async function sendToObsidian(id: number): Promise<void> {
    setBusy(true)
    setError(null)
    setSentMessage('')

    try {
      await window.api.sendToObsidian(id)
      setSentMessage('Sent to Benson Inbox in Obsidian.')
      await loadHistory()
    } catch {
      setError('Could not send the transcript to Obsidian. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function openRecording(recording: SavedRecording): Promise<void> {
    setQwenReply('')
    setQwenError('')
    setBusy(true)
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
      setBusy(false)
    }
  }

  async function startRecording(): Promise<void> {
    setQwenReply('')
    setQwenError('')
    setError(null)
    setSentMessage('')
    setBusy(true)
    // Close the old player before recording a new clip.
    setAudioUrl(null)
    setSavedPath(null)
    setTranscript(null)
    let mic: MediaStream | null = null
    try {
      // Ask for the mic. Mac will ask for permission the first time.
      mic = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(mic)
      const chunks: Blob[] = []

      // Audio comes in pieces while recording, so collect them.
      recorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      // Once stopped, combine the pieces into one clip and hand it to the player.
      recorder.onstop = async () => {
        // Turn the mic off now that we are done with it.
        recorder.stream.getTracks().forEach((track) => track.stop())
        recorderRef.current = null

        const blob = new Blob(chunks, { type: 'audio/webm' })
        await processRecording(blob)
      }

      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    } catch (error) {
      mic?.getTracks().forEach((track) => track.stop())
      setError(`Could not start recording: ${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  function stopRecording(): void {
    setBusy(true)
    recorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <main>
      <h1>Benson</h1>
      <label htmlFor="qwen-prompt">Qwen prompt</label>
      <textarea
        id="qwen-prompt"
        rows={4}
        value={prompt}
        disabled={busy || recording}
        onChange={(event) => {
          setPrompt(event.target.value)
          setQwenReply('')
        }}
      />
      <p>
        Stopping a recording saves it, sends the transcript to Obsidian, and asks Qwen to classify
        it.
      </p>
      <button
        disabled={busy || (!recording && !prompt.trim())}
        onClick={recording ? stopRecording : startRecording}
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
          {selected?.transcript && (
            <button disabled={busy || recording} onClick={() => sendToObsidian(selected.id)}>
              Send to Obsidian
            </button>
          )}
          {sentMessage && <p role="status">{sentMessage}</p>}
          {qwenError && (
            <>
              <p role="alert">{qwenError}</p>
              <button
                disabled={busy || recording || !prompt.trim()}
                onClick={async () => {
                  if (!transcript) return
                  setBusy(true)
                  await classifyTranscript(transcript)
                  setBusy(false)
                }}
              >
                Retry Qwen
              </button>
            </>
          )}
          <div aria-live="polite">
            {qwenReply && (
              <>
                <h2>Qwen reply</h2>
                <p className="transcript">{qwenReply}</p>
              </>
            )}
          </div>
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
