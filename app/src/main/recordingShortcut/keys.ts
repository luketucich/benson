import type { RecordingShortcut } from '../../shortcut'

// Mac key numbers from Apple's Events.h.
const keyCodes: Record<string, number> = {
  KeyA: 0,
  KeyS: 1,
  KeyD: 2,
  KeyF: 3,
  KeyH: 4,
  KeyG: 5,
  KeyZ: 6,
  KeyX: 7,
  KeyC: 8,
  KeyV: 9,
  KeyB: 11,
  KeyQ: 12,
  KeyW: 13,
  KeyE: 14,
  KeyR: 15,
  KeyY: 16,
  KeyT: 17,
  Digit1: 18,
  Digit2: 19,
  Digit3: 20,
  Digit4: 21,
  Digit6: 22,
  Digit5: 23,
  Digit9: 25,
  Digit7: 26,
  Digit8: 28,
  Digit0: 29,
  KeyO: 31,
  KeyU: 32,
  KeyI: 34,
  KeyP: 35,
  KeyL: 37,
  KeyJ: 38,
  KeyK: 40,
  KeyN: 45,
  KeyM: 46,
  Space: 49,
  F1: 122,
  F2: 120,
  F3: 99,
  F4: 118,
  F5: 96,
  F6: 97,
  F7: 98,
  F8: 100,
  F9: 101,
  F10: 109,
  F11: 103,
  F12: 111,
  F13: 105,
  F14: 107,
  F15: 113,
  F16: 106,
  F17: 64,
  F18: 79,
  F19: 80,
  F20: 90,
  ArrowLeft: 123,
  ArrowRight: 124,
  ArrowDown: 125,
  ArrowUp: 126,
  // The keypad. Browsers call the Mac's Clear key NumLock.
  NumLock: 71,
  NumpadDecimal: 65,
  NumpadMultiply: 67,
  NumpadAdd: 69,
  NumpadDivide: 75,
  NumpadEnter: 76,
  NumpadSubtract: 78,
  NumpadEqual: 81,
  Numpad0: 82,
  Numpad1: 83,
  Numpad2: 84,
  Numpad3: 85,
  Numpad4: 86,
  Numpad5: 87,
  Numpad6: 88,
  Numpad7: 89,
  Numpad8: 91,
  Numpad9: 92
}

// Keys that never type text, so they work as a shortcut on their own.
function standsAlone(code: string): boolean {
  return /^F\d+$/.test(code) || code === 'NumLock'
}

// Names people know, for keys whose browser names are unclear.
const keyNames: Record<string, string> = {
  NumLock: 'Clear',
  NumpadDecimal: 'Keypad .',
  NumpadMultiply: 'Keypad *',
  NumpadAdd: 'Keypad +',
  NumpadDivide: 'Keypad /',
  NumpadEnter: 'Keypad Enter',
  NumpadSubtract: 'Keypad -',
  NumpadEqual: 'Keypad ='
}

export function keyCodeFor(code: string): number {
  return keyCodes[code]
}

// Carbon modifier numbers, also from Events.h.
export function modifiersFor(key: RecordingShortcut): number {
  return (
    (key.meta ? 256 : 0) | (key.shift ? 512 : 0) | (key.alt ? 2048 : 0) | (key.control ? 4096 : 0)
  )
}

// A shortcut needs a key we know and, unless the key never types text, a
// modifier. Otherwise it would take that key away from typing.
export function validateShortcut(value: unknown): RecordingShortcut {
  if (!value || typeof value !== 'object') throw new Error('Choose a recording shortcut.')
  const key = value as RecordingShortcut

  if (
    !Object.hasOwn(keyCodes, key.code) ||
    ![key.control, key.alt, key.shift, key.meta].every((field) => typeof field === 'boolean') ||
    (!key.control && !key.alt && !key.meta && !standsAlone(key.code))
  ) {
    throw new Error(
      'Add Control, Option, or Command, or use a function key or Clear. For example, Control + Option + Space.'
    )
  }

  return { code: key.code, control: key.control, alt: key.alt, shift: key.shift, meta: key.meta }
}

// The modifier keys being held, like "Control + Option".
export function modifierLabel(key: Omit<RecordingShortcut, 'code'>): string {
  return [
    key.control && 'Control',
    key.alt && 'Option',
    key.shift && 'Shift',
    key.meta && 'Command'
  ]
    .filter(Boolean)
    .join(' + ')
}

export function labelFor(key: RecordingShortcut): string {
  const name =
    keyNames[key.code] ??
    key.code
      .replace(/^(Key|Digit)/, '')
      .replace('Arrow', '')
      .replace(/^Numpad/, 'Keypad ')
  return [modifierLabel(key), name].filter(Boolean).join(' + ')
}
