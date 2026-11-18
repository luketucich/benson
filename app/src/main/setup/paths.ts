import { app } from 'electron'
import { join } from 'path'

// Programs Benson downloads live in its own folder, never anywhere else.
export function toolsFolder(): string {
  return join(app.getPath('userData'), 'tools')
}

// Put first on the PATH, so a copy Benson had to download wins over an older one.
export function toolsBin(): string {
  return join(toolsFolder(), 'bin')
}
