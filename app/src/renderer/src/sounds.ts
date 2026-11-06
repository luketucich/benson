// Short sounds made in code, so there are no audio files to ship.
let context: AudioContext | null = null

type Note = [frequency: number, delay: number]

// Each note is a soft sine with a quieter octave on top, faded in and out so
// it never clicks.
function play(notes: Note[], volume = 0.12): void {
  context ??= new AudioContext()
  const ctx = context
  if (ctx.state === 'suspended') void ctx.resume()

  for (const [frequency, delay] of notes) {
    const start = ctx.currentTime + delay
    const length = 0.22
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
    gain.connect(ctx.destination)

    for (const [type, multiple, level] of [
      ['sine', 1, 1],
      ['triangle', 2, 0.18]
    ] as const) {
      const tone = ctx.createOscillator()
      const toneGain = ctx.createGain()
      tone.type = type
      tone.frequency.value = frequency * multiple
      toneGain.gain.value = level
      tone.connect(toneGain).connect(gain)
      tone.start(start)
      tone.stop(start + length + 0.02)
    }
  }
}

// Two notes going up when recording starts, and back down when it stops.
export const playStartSound = (): void =>
  play([
    [587.33, 0],
    [880, 0.07]
  ])

export const playStopSound = (): void =>
  play([
    [880, 0],
    [587.33, 0.07]
  ])

// A small three-note chime when a note reaches Obsidian.
export const playSentSound = (): void =>
  play(
    [
      [783.99, 0],
      [987.77, 0.08],
      [1318.51, 0.16]
    ],
    0.1
  )
