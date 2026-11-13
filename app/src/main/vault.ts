import { app, dialog } from 'electron'
import { existsSync, mkdirSync, realpathSync } from 'fs'
import { basename, dirname, isAbsolute, join, relative, sep } from 'path'
import { setDraftVault } from './noteWriter'
import { closeVault, connectToVault } from './obsidian'
import { getSettings, saveSettings } from './settings'
import type { Settings } from '../settings'
import { validateNotePath } from '../noteDraft'

// Connects Benson to an Obsidian vault folder. Picking a different folder
// closes the old connection first.
export async function openVault(vaultPath: string): Promise<void> {
  await closeVault()
  mkdirSync(vaultPath, { recursive: true })
  const mcpVault = join(app.getAppPath(), 'node_modules/@bitbonsai/mcpvault/dist/server.js')
  await connectToVault(vaultPath, mcpVault)
  setDraftVault(vaultPath)
  console.log(`Connected to the Obsidian vault at ${vaultPath}`)
}

// Moves Benson to a new vault folder and remembers it. If it can't be opened,
// Benson goes back to the one it had, so notes never end up split between two
// vaults.
export async function switchVault(vaultPath: string): Promise<Settings> {
  try {
    await openVault(vaultPath)
  } catch (error) {
    await openVault(getSettings().vaultPath).catch(() => {})
    throw error
  }
  return saveSettings({ vaultPath })
}

// Where a note sits inside the vault, like "Food/Groceries.md". Null if the
// file is somewhere else. A new note doesn't exist yet, so its folder is checked.
function insideVault(file: string): string | null {
  const vault = realpathSync(getSettings().vaultPath)
  const path = relative(vault, join(realpathSync(dirname(file)), basename(file)))
  return path.startsWith('..') || isAbsolute(path) ? null : path.split(sep).join('/')
}

// Only answers for real note paths inside the vault, never anywhere else on disk.
export function noteExists(notePath: string): boolean {
  try {
    validateNotePath(notePath)
  } catch {
    return false
  }
  return existsSync(join(getSettings().vaultPath, notePath))
}

// Where a note goes: added to one that's there, or made as a new one.
type NoteChoice = { path: string; action: 'append' | 'create' }

const markdown = [{ name: 'Markdown notes', extensions: ['md'] }]

// Opens the Mac's file picker in the vault, starting where the note would go.
// Answers where the note goes, or null if you cancel.
export async function chooseNote(
  current: string,
  action: NoteChoice['action']
): Promise<NoteChoice | null> {
  const vault = getSettings().vaultPath
  const folder = existsSync(join(vault, dirname(current))) ? join(vault, dirname(current)) : vault
  const file =
    action === 'append' ? await pickNote(folder) : await nameNote(join(folder, basename(current)))
  if (!file) return null

  const path = insideVault(file)
  if (!path) throw new Error('Choose a note inside your vault.')
  validateNotePath(path)
  // A note picked in the save dialog may already be there. Then it's added to.
  return { path, action: existsSync(file) ? 'append' : 'create' }
}

// The open dialog, for a note that's already in the vault.
async function pickNote(folder: string): Promise<string | undefined> {
  const choice = await dialog.showOpenDialog({
    title: 'Choose a note to add to',
    defaultPath: folder,
    properties: ['openFile'],
    filters: markdown
  })
  return choice.filePaths[0]
}

// The save dialog, for naming a new note. It starts with Benson's name for it.
async function nameNote(suggested: string): Promise<string | undefined> {
  const choice = await dialog.showSaveDialog({
    title: 'Name your new note',
    buttonLabel: 'Choose',
    defaultPath: suggested,
    properties: ['createDirectory'],
    filters: markdown
  })
  return choice.filePath || undefined
}
