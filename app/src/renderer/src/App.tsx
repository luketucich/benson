import { useEffect, useRef, useState } from 'react'

function App(): React.JSX.Element {
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The recorder lives here so it survives between renders.
  const recorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  async function saveAndTranscribe(blob: Blob): Promise<void> {
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
    } catch (error) {
      setError(`Could not save or transcribe the recording: ${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  async function startRecording(): Promise<void> {
    setError(null)
    setBusy(true)
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
        await saveAndTranscribe(blob)
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
    <div>
      <h1>Benson</h1>
      <button disabled={busy} onClick={recording ? stopRecording : startRecording}>
        {recording ? 'Stop' : 'Record'}
      </button>
      {audioUrl && (
        <div>
          <audio controls src={audioUrl} />
        </div>
      )}
      {savedPath && <p>Saved to {savedPath}</p>}
      {busy && <p role="status">Working...</p>}
      {error && <p role="alert">{error}</p>}
      {transcript && <p>{transcript}</p>}
    </div>
  )
}

export default App
