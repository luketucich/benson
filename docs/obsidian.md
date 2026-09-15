# Obsidian

Benson connects to Obsidian through [MCPVault](https://github.com/bitbonsai/mcpvault), an MCP server that reads and writes the Markdown files in a vault. Obsidian does not need to be open, and no plugin is needed. MCPVault also blocks access outside the vault and to hidden folders like `.obsidian`.

When Benson starts, it runs MCPVault on `~/Documents/Benson Vault` and connects to it. MCPVault stops when Benson quits. To see the notes, choose **Open folder as vault** in Obsidian and pick that folder.

MCPVault runs with the Node.js included in Electron, so there is nothing extra to install.
