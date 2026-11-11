import { useEffect, useState } from 'react'

// How many bars the voice memo's waveform has.
const BARS = 36

interface Clip {
  url: string | null
  // Each bar's height, from 0 to 1.
  bars: number[]
  duration: number
  failed: boolean
}

// Loads one of Benson's saved clips: a playable address, its length, and a
// waveform made from how loud each slice of it is.
export function useClip(path: string): Clip {
  const [clip, setClip] = useState<Clip>({ url: null, bars: [], duration: 0, failed: false })

  useEffect(() => {
    let url: string | null = null
    let cancelled = false

    async function load(): Promise<void> {
      const bytes = await window.api.readAudio(path)
      url = URL.createObjectURL(new Blob([bytes], { type: 'audio/webm' }))
      // Decoding gives the sound itself, for the waveform and the exact length.
      const context = new AudioContext()
      const audio = await context.decodeAudioData(bytes.slice(0)).finally(() => context.close())
      if (!cancelled)
        setClip({ url, bars: waveform(audio), duration: audio.duration, failed: false })
    }

    load().catch(() => !cancelled && setClip((old) => ({ ...old, failed: true })))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [path])

  return clip
}

// Splits the sound into slices and keeps the loudest moment of each.
function waveform(audio: AudioBuffer): number[] {
  const samples = audio.getChannelData(0)
  const size = Math.max(1, Math.floor(samples.length / BARS))
  const peaks = Array.from({ length: BARS }, (_, bar) => {
    let peak = 0
    for (let i = bar * size; i < (bar + 1) * size && i < samples.length; i++) {
      peak = Math.max(peak, Math.abs(samples[i]))
    }
    return peak
  })
  // Scale so the loudest bar is full height, and quiet bars still show a little.
  const loudest = Math.max(...peaks, 0.01)
  return peaks.map((peak) => Math.max(0.12, peak / loudest))
}
