# Benson MVP Plan

## Goal

Get one complete flow working well before adding anything else. The target was **Friday, October 2, 2026**.

## How it works

1. Record and save a short audio clip.
2. Parakeet turns the audio into a transcript.
3. Qwen picks an Obsidian note and drafts the text.
4. A preview shows the action, destination, and text so I can edit them.
5. **Send** writes the note. **Cancel** keeps just the recording.
6. SQLite keeps the recording path, transcript, and sent time. The audio is a separate file.

## What the MVP has

- A small Mac menu bar app
- A **Record** button and a hold-to-record shortcut
- An editable destination and note text
- **Send** and **Cancel** in the preview
- A simple history list
- One Obsidian vault
- The default microphone

## Tools

- **Desktop app:** Electron, React, and TypeScript
- **Speech-to-text:** NVIDIA Parakeet TDT 0.6B v2 through [parakeet-mlx](https://github.com/senstella/parakeet-mlx)
- **Local model:** Qwen3.5 4B through [Ollama](https://ollama.com/library/qwen3.5:4b)
- **Storage:** SQLite
- **Obsidian connector:** [MCPVault](https://github.com/bitbonsai/mcpvault)

Qwen only drafts text. It cannot run tools or write notes. See [Obsidian](obsidian.md) for how drafts are checked and saved.

## Not in the MVP

- Continuous listening or meeting recording
- Deleting, renaming, or moving notes
- Calendar, task, email, or other connectors
- Windows support

These add setup and edge cases without making the first demo better.

## Later ideas

- Google Calendar events
- A nicer main window
- A small floating review window
- Sounds and small animations
- More settings
- Windows support
- More connectors
