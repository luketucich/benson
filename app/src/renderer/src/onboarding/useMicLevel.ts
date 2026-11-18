import { useEffect, useState } from 'react'
import { openMic, stopMic } from '../mic'

// How loud the microphone is right now, from 0 to 1, so onboarding can show
// that Benson hears you. Only listens while `on` is true.
export function useMicLevel(micId: string, on: boolean): number {
  const [level, setLevel] = useState(0)

  useEffect(() => {
    if (!on) return
    let stopped = false
    let frame = 0
    let stream: MediaStream | null = null
    const context = new AudioContext()

    void openMic(micId)
      .then((mic) => {
        stream = mic
        if (stopped) return stopMic(mic)
        const analyser = context.createAnalyser()
        analyser.fftSize = 512
        context.createMediaStreamSource(mic).connect(analyser)
        const samples = new Float32Array(analyser.fftSize)

        // Loudness is the average size of the wave, scaled so talking fills it.
        const measure = (): void => {
          analyser.getFloatTimeDomainData(samples)
          const loudness = Math.sqrt(
            samples.reduce((sum, value) => sum + value * value, 0) / samples.length
          )
          // Rounded to the meter's steps, so the screen only redraws when a bar changes.
          setLevel(Math.round(Math.min(1, loudness * 6) * 20) / 20)
          frame = requestAnimationFrame(measure)
        }
        measure()
      })
      .catch(() => setLevel(0))

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      if (stream) stopMic(stream)
      void context.close()
    }
  }, [micId, on])

  return level
}
