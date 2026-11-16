import { useEffect, useRef, useState } from 'react'
import { openMic, stopMic } from '../mic'
import { useEventCallback } from './useEventCallback'

interface Options {
  // The microphone picked in settings. Empty means the Mac's default.
  micId: string
  // The finished recording, and how long it ran in seconds.
  onClip: (blob: Blob, seconds: number) => void
  onError: (message: string) => void
}

// Owns the microphone and the recorder. It does not decide when recording is
// allowed; the screen checks that before calling start.
export function useRecorder({ micId, onClip, onError }: Options): {
  recording: boolean
  busy: boolean
  start: (fromShortcut?: boolean) => Promise<void>
  stop: () => void
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
  const startedAtRef = useRef(0)

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
      // Mac asks for microphone permission the first time. If the chosen
      // microphone is unplugged, the browser falls back to the default one.
      mic = await openMic(micId)

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
        fromShortcutRef.current = false
        setBusy(false)
        const seconds = (performance.now() - startedAtRef.current) / 1000
        clip(new Blob(chunks, { type: 'audio/webm' }), seconds)
      }

      recorder.onerror = () => {
        broke = true
        stopMic(recorder.stream)
        reset()
        fail('Microphone stopped. Try recording again.')
      }

      recorder.start()
      startedAtRef.current = performance.now()
      recorderRef.current = recorder
      setRecording(true)
      setBusy(false)
      window.api.setRecordingActivity('recording')
    } catch (error) {
      if (mic) stopMic(mic)
      reset()
      fail(`Could not start recording: ${String(error)}`)
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
    setHeld: (down) => {
      heldRef.current = down
    },
    startedByShortcut: () => fromShortcutRef.current
  }
}
