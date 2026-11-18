import { useEffect, useState } from 'react'
import type { SettingsControls } from '../hooks/useSettings'
import { useAudioDevices } from '../hooks/useAudioDevices'
import { DevicePicker } from '../components/DevicePicker'
import { MicIcon, SpeakerIcon } from '../components/icons'
import { Screen } from './Screen'
import { useMicLevel } from './useMicLevel'

const BARS = 14

// The microphone and speaker. macOS asks for the microphone here, and the
// bars show Benson hears you.
export function DevicesStep({
  settings: { settings, chooseMic, chooseSpeaker },
  onNext
}: {
  settings: SettingsControls
  onNext: () => void
}): React.JSX.Element {
  // Null until macOS answers.
  const [access, setAccess] = useState<string | null>(null)
  const { mics, speakers } = useAudioDevices()
  const allowed = access !== 'denied' && access !== 'restricted'
  const level = useMicLevel(settings.micId, access === 'granted')

  // Ask the first time. If it was turned down, check again whenever you come
  // back from System Settings.
  useEffect(() => {
    async function check(): Promise<void> {
      let now = await window.api.micAccess()
      if (now === 'not-determined') now = (await window.api.askMicAccess()) ? 'granted' : 'denied'
      setAccess(now)
    }
    void check()
    window.addEventListener('focus', check)
    return () => window.removeEventListener('focus', check)
  }, [])

  return (
    <Screen
      visual={
        <div className="onboarding-meter" aria-hidden="true">
          {Array.from({ length: BARS }, (_, bar) => (
            <span key={bar} className={level > bar / BARS ? 'lit' : ''} />
          ))}
        </div>
      }
      title={allowed ? 'Can Benson hear you?' : 'Benson needs your microphone'}
      description={
        allowed
          ? 'Say something. The bars move when Benson hears you. Pick a different microphone or speaker if these aren’t right.'
          : 'Turn on Benson under Microphone in System Settings, then come back here.'
      }
    >
      {allowed ? (
        <>
          <div className="onboarding-devices">
            <label>
              <MicIcon />
              <DevicePicker
                id="onboarding-mic"
                devices={mics}
                value={settings.micId}
                onChange={chooseMic}
              />
            </label>
            <label>
              <SpeakerIcon />
              <DevicePicker
                id="onboarding-speaker"
                devices={speakers}
                value={settings.speakerId}
                onChange={chooseSpeaker}
              />
            </label>
          </div>
          <button className="button-primary onboarding-main" onClick={onNext}>
            Sounds good
          </button>
        </>
      ) : (
        <button
          className="button-primary onboarding-main"
          onClick={() => void window.api.openMicSettings()}
        >
          Open System Settings
        </button>
      )}
    </Screen>
  )
}
