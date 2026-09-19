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

// Benson only uses these MCPVault tools, so it cannot delete, move, or rename notes.
const allowedTools = ['read_note', 'write_note']

async function callTool(name: string, args: Record<string, unknown>): Promise<string> {
  if (!client) throw new Error('Benson is not connected to the Obsidian vault.')
  if (!allowedTools.includes(name)) throw new Error(`Benson does not allow ${name}.`)

  const result = await client.callTool({ name, arguments: args })
  // MCPVault replies with text, including its error messages.
  const text = result.content.map((part) => (part.type === 'text' ? part.text : '')).join('')
  if (result.isError) throw new Error(text)
  return text
}

// Add text to the end of a note. MCPVault creates the note if it is missing.
export async function appendToNote(notePath: string, text: string): Promise<void> {
  if (!notePath.endsWith('.md')) throw new Error('Obsidian notes must end in .md.')

  // MCPVault adds the text right after the last character, so start a new paragraph.
  let content = text
  try {
    await callTool('read_note', { path: notePath })
    content = `\n\n${text}`
  } catch {
    // The note does not exist yet.
  }

  // Always set the mode. Without it, MCPVault replaces the whole note.
  await callTool('write_note', { path: notePath, content, mode: 'append' })
}
