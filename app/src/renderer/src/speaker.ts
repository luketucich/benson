// The speaker picked in settings. Benson's sounds and the mini player both
// play through it. An empty id means the Mac's default output.
let speakerId = ''

export function setSpeaker(id: string): void {
  speakerId = id
}

// Sends an audio element or Benson's sound player to the chosen speaker. If
// that speaker has been unplugged, sound stays on the default one.
export function playThroughSpeaker(target: HTMLMediaElement | AudioContext): void {
  if (target.sinkId !== speakerId) target.setSinkId(speakerId).catch(() => {})
}
