// Version numbers from tools' "--version" output, like "uv 0.13.7 (...)".
// This file imports nothing, so the tests can load it on its own.

// The first x.y.z in the text, or null if there isn't one.
export function parseVersion(text: string): string | null {
  return text.match(/\d+\.\d+\.\d+/)?.[0] ?? null
}

// Compares part by part as numbers, so 0.40.0 is newer than 0.9.9.
export function isAtLeast(version: string, minimum: string): boolean {
  const have = version.split('.').map(Number)
  const need = minimum.split('.').map(Number)
  for (let part = 0; part < need.length; part++) {
    const difference = (have[part] ?? 0) - need[part]
    if (difference !== 0) return difference > 0
  }
  return true
}
