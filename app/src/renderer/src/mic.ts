// Turns on the microphone picked in settings ('' means the Mac's default).
// If that one is unplugged, the browser falls back to the default.
export function openMic(micId: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ audio: micId ? { deviceId: micId } : true })
}

// Turns the microphone off again.
export function stopMic(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop())
}
