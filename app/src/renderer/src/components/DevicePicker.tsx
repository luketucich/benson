// A microphone or speaker picker. Settings and onboarding both use it.
export function DevicePicker({
  id,
  devices,
  value,
  onChange
}: {
  id: string
  devices: MediaDeviceInfo[]
  value: string
  onChange: (id: string) => void
}): React.JSX.Element {
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Mac default</option>
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {deviceName(device)}
        </option>
      ))}
    </select>
  )
}

// The device's name without the USB id Chrome adds, like "(0c76:1716)".
function deviceName(device: MediaDeviceInfo): string {
  return device.label.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)$/i, '') || 'Unnamed device'
}
