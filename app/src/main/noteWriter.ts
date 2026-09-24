import { constants } from 'node:fs'
import { lstat, mkdir, open, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { validateDraft, type NoteDraft } from '../noteDraft'
import { getRecording, markRecordingSent } from './database'

let vaultFolder: string | null = null
const sending = new Set<number>()
const written = new Set<number>()

export function setDraftVault(path: string): void {
  vaultFolder = path
}

async function notePath(draft: NoteDraft): Promise<string> {
  if (!vaultFolder) throw new Error('Benson is not connected to the Obsidian vault.')
  let folder = await realpath(vaultFolder)
  const parts = draft.path.split('/')
  for (const part of parts.slice(0, -1)) {
    folder = join(folder, part)
    if (draft.action === 'create') {
      await mkdir(folder).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'EEXIST') throw error
      })
    }
    const info = await lstat(folder)
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new Error('The note folder must be a real folder inside the vault.')
    }
  }
  return join(folder, parts[parts.length - 1])
}

async function writeDraft(draft: NoteDraft): Promise<void> {
  try {
    const path = await notePath(draft)
    // MCPVault has no exclusive create and can overwrite after a failed read.
    // These flags reject existing create targets and missing append targets.
    const flags =
      draft.action === 'create'
        ? constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW
        : constants.O_WRONLY | constants.O_APPEND | constants.O_NOFOLLOW
    const file = await open(path, flags, 0o600)
    try {
      const info = await file.stat()
      if (!info.isFile()) throw new Error('The destination must be a Markdown file.')
      const separator = draft.action === 'append' && info.size > 0 ? '\n\n' : ''
      await file.writeFile(separator + draft.content, 'utf8')
      await file.sync()
    } finally {
      await file.close()
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'EEXIST') throw new Error('That note already exists. Choose a new path.')
    if (code === 'ENOENT')
      throw new Error('The note or its folder is missing. Check the destination.')
    if (code === 'EACCES' || code === 'EPERM')
      throw new Error('Permission denied. The note was not sent.')
    if (code === 'ELOOP') throw new Error('Symbolic links cannot be used as note destinations.')
    throw error
  }
}

export async function saveApprovedDraft(id: number, value: unknown): Promise<void> {
  const draft = validateDraft(value)
  if (draft.action === 'clarify') throw new Error('Clarify the request before sending a note.')
  const recording = getRecording(id)
  if (!recording?.transcript?.trim()) throw new Error('This recording has no transcript.')
  if (recording.sent_at) throw new Error('This recording has already been sent.')
  if (sending.has(id)) throw new Error('This recording is already being sent.')

  sending.add(id)
  try {
    // If saving the timestamp fails, a retry in this session must not write twice.
    if (!written.has(id)) {
      await writeDraft(draft)
      written.add(id)
    }
    markRecordingSent(id)
  } finally {
    sending.delete(id)
  }
}
