# Obsidian

Benson connects to Obsidian through [MCPVault](https://github.com/bitbonsai/mcpvault), an MCP server that reads and writes the Markdown files in a vault. Obsidian does not need to be open, and no plugin is needed. MCPVault also blocks access outside the vault and to hidden folders like `.obsidian`.

When Benson starts, it runs MCPVault on `~/Documents/Benson Vault` and connects to it. MCPVault stops when Benson quits. To see the notes, choose **Open folder as vault** in Obsidian and pick that folder.

MCPVault runs with the Node.js included in Electron, so there is nothing extra to install.

After you stop recording, Benson saves the transcript and adds it to `Benson Inbox.md`. The **Send to Obsidian** button also lets you send an older recording or retry a failed send. Sending again adds the transcript again.

Benson searches for matching notes and gives Qwen their paths and up to 3,000 characters from each note. It skips `Benson Inbox.md`, since that already contains the transcript. Qwen uses the prompt on screen to suggest a category and destination. This is a suggestion only; transcripts still go to the Inbox.

Ollama must be running with `qwen3.5:4b` installed. Qwen replies are not saved or sent to Obsidian.

Suggestions can be wrong, especially for unclear transcripts. Search matches words from the transcript, so different wording can miss a relevant note.
