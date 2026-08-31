import { useRef, useState } from 'react'

function App(): React.JSX.Element {
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  // The recorder lives here so it survives between renders.
  const recorderRef = useRef<MediaRecorder | null>(null)

  async function startRecording(): Promise<void> {
    // Ask for the mic. Mac will ask for permission the first time.
    const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(mic)
    const chunks: Blob[] = []

    // Audio comes in pieces while recording, so collect them.
    recorder.ondataavailable = (event) => chunks.push(event.data)

    // Once stopped, combine the pieces into one clip and hand it to the player.
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      setAudioUrl(URL.createObjectURL(blob))
      // Turn the mic off now that we are done with it.
      mic.getTracks().forEach((track) => track.stop())
    }

    recorder.start()
    recorderRef.current = recorder
    setRecording(true)
  }

  function stopRecording(): void {
    recorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <div>
      <h1>Benson</h1>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? 'Stop' : 'Record'}
      </button>
      {audioUrl && (
        <div>
          <audio controls src={audioUrl} />
        </div>
      )}
    </div>
  )
}

export default App
