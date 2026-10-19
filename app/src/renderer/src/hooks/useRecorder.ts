import { useEffect, useRef, useState } from 'react'
import { useEventCallback } from './useEventCallback'

interface Options {
  onClip: (blob: Blob, fromShortcut: boolean) => void
  onError: (message: string, fromShortcut: boolean) => void
}

function stopMic(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop())
}

// Owns the microphone and the recorder. It does not decide when recording is
// allowed; the screen checks that before calling start.
export function useRecorder({ onClip, onError }: Options): {
  recording: boolean
  busy: boolean
  start: (fromShortcut?: boolean) => Promise<void>
  stop: () => void
  toggle: () => void
  setHeld: (down: boolean) => void
  startedByShortcut: () => boolean
} {
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)

  const recorderRef = useRef<MediaRecorder | null>(null)
  // Checked right away so quick key presses cannot start two recordings.
  const startingRef = useRef(false)
  const heldRef = useRef(false)
  const fromShortcutRef = useRef(false)
  const stopRequestedRef = useRef(false)

  const clip = useEventCallback(onClip)
  const fail = useEventCallback(onError)

  // Turn the microphone off if the screen goes away mid-recording.
  useEffect(() => {
    return () => {
      const recorder = recorderRef.current
      if (!recorder) return
      recorder.onstop = null
      if (recorder.state === 'recording') recorder.stop()
      stopMic(recorder.stream)
    }
  }, [])

  function reset(): void {
    recorderRef.current = null
    fromShortcutRef.current = false
    setRecording(false)
    setBusy(false)
    window.api.setRecordingActivity('idle')
  }

  async function start(fromShortcut = false): Promise<void> {
    if (startingRef.current || recorderRef.current) return
    startingRef.current = true
    fromShortcutRef.current = fromShortcut
    stopRequestedRef.current = false
    setBusy(true)
    window.api.setRecordingActivity('starting')

    let mic: MediaStream | null = null
    try {
      // Mac asks for microphone permission the first time.
      mic = await navigator.mediaDevices.getUserMedia({ audio: true })

      // The key may be released while the permission window is open.
      if (stopRequestedRef.current || (fromShortcut && !heldRef.current)) {
        stopMic(mic)
        reset()
        return
      }

      const recorder = new MediaRecorder(mic)
      const chunks: Blob[] = []
      let broke = false

      // Audio comes in pieces while recording, so collect them.
      recorder.ondataavailable = (event) => chunks.push(event.data)

      recorder.onstop = () => {
        stopMic(recorder.stream)
        recorderRef.current = null
        if (broke) return
        const wasShortcut = fromShortcutRef.current
        fromShortcutRef.current = false
        setBusy(false)
        clip(new Blob(chunks, { type: 'audio/webm' }), wasShortcut)
      }

      recorder.onerror = () => {
        broke = true
        const wasShortcut = fromShortcutRef.current
        stopMic(recorder.stream)
        reset()
        fail('Microphone stopped. Try recording again.', wasShortcut)
      }

      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      setBusy(false)
      window.api.setRecordingActivity('recording')
    } catch (error) {
      if (mic) stopMic(mic)
      const wasShortcut = fromShortcutRef.current
      reset()
      fail(`Could not start recording: ${String(error)}`, wasShortcut)
    } finally {
      startingRef.current = false
    }
  }

  function stop(): void {
    stopRequestedRef.current = true
    const recorder = recorderRef.current
    if (startingRef.current || recorder?.state !== 'recording') return
    setBusy(true)
    setRecording(false)
    window.api.setRecordingActivity('processing')
    recorder.stop()
  }

  return {
    recording,
    busy,
    start,
    stop,
    toggle: () => (recording ? stop() : void start()),
    setHeld: (down) => {
      heldRef.current = down
    },
    startedByShortcut: () => fromShortcutRef.current
  }
}
