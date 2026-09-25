import { Client } from '@modelcontextprotocol/client'
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio'

let client: Client | null = null

// Start MCPVault for one vault folder and connect to it.
export async function connectToVault(vaultPath: string, serverPath: string): Promise<void> {
  const transport = new StdioClientTransport({
    // Run MCPVault with the Node.js built into Electron, so nothing extra needs installing.
    command: process.execPath,
    args: [serverPath, vaultPath],
    env: { ELECTRON_RUN_AS_NODE: '1' }
  })

  client = new Client({ name: 'benson', version: '1.0.0' })
  await client.connect(transport)
}

// Closing the connection also stops MCPVault.
export async function closeVault(): Promise<void> {
  await client?.close()
}

// Suggestions only need read access. Approved writes are handled in noteWriter.ts.
const allowedTools = ['list_directory', 'search_notes', 'read_note']

async function callTool(name: string, args: Record<string, unknown>): Promise<string> {
  if (!client) throw new Error('Benson is not connected to the Obsidian vault.')
  if (!allowedTools.includes(name)) throw new Error(`Benson does not allow ${name}.`)

  const result = await client.callTool({ name, arguments: args })
  // MCPVault replies with text, including its error messages.
  const text = result.content.map((part) => (part.type === 'text' ? part.text : '')).join('')
  if (result.isError) throw new Error(text)
  return text
}

// List the files and folders in one vault folder.
export async function listDirectory(path = '/'): Promise<string> {
  return callTool('list_directory', { path })
}

// Find up to five notes containing the search text.
export async function searchNotes(query: string): Promise<string> {
  if (!query.trim()) throw new Error('Enter some search text.')

  return callTool('search_notes', {
    query: query.trim(),
    limit: 5
  })
}

// Read a note's text.
export async function readNote(path: string): Promise<string> {
  if (!path.endsWith('.md')) throw new Error('Obsidian notes must end in .md.')

  const result = await callTool('read_note', { path })
  return JSON.parse(result).content
}
