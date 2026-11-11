import { useEffect, useState } from 'react'

// The microphones and speakers plugged in right now. The list updates when
// something is plugged in or unplugged.
export function useAudioDevices(): { mics: MediaDeviceInfo[]; speakers: MediaDeviceInfo[] } {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    const load = (): void => {
      void navigator.mediaDevices.enumerateDevices().then(setDevices)
    }
    load()
    navigator.mediaDevices.addEventListener('devicechange', load)
    return () => navigator.mediaDevices.removeEventListener('devicechange', load)
  }, [])

  // The browser also lists a "default" entry; Benson's own Default option covers it.
  const real = devices.filter((device) => device.deviceId && device.deviceId !== 'default')
  return {
    mics: real.filter((device) => device.kind === 'audioinput'),
    speakers: real.filter((device) => device.kind === 'audiooutput')
  }
}
