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
