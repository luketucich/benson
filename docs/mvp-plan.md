# Benson MVP Plan

## Goal

- Finish the full MVP by **Friday, October 2, 2026**.
- Make one complete flow work well before adding extra features.

## How It Works

1. Record and save a short audio clip.
2. Use Parakeet to turn the audio into a transcript.
3. Use Qwen to choose an Obsidian note and prepare the content.
4. Show a review preview with the action, destination, and note text. Allow destination and text edits.
5. Send only after approval, or cancel and keep the saved recording.
6. Keep the recording path, transcript, and successful sent time in SQLite. Store the audio separately.

The review flow is implemented and was tested during catch-up work on October 1. Audio and transcripts are saved before drafting; generation alone does not write notes. Drafts are held only in memory and disappear when switching recordings, changing the prompt, or restarting.

The September 26–October 2 work remains the recording hotkey and broader MVP testing with real speech and more requests. One synthetic-speech flow does not establish everyday accuracy.

## Basic App

- A small menu bar app for Mac
- A **Record** button
- A hotkey to start and stop recording
- A saved transcript and editable note destination and text
- **Send** and **Cancel** in the review preview
- A simple history list
- One Obsidian vault
- The default microphone

## Tools

- **Desktop app:** Electron, React, and TypeScript
- **Speech-to-text:** NVIDIA Parakeet TDT 0.6B v2
- **Speech runtime on Mac:** parakeet-mlx
- **Local model:** Qwen3.5 4B
- **Local storage:** SQLite
- **Destination:** Obsidian
- **Connector:** [MCPVault](https://github.com/bitbonsai/mcpvault)

## Local Qwen and Obsidian

Benson currently uses Ollama with `qwen3.5:4b`. Run `ollama serve`, then `ollama pull qwen3.5:4b` in another terminal. Qwen returns a structured draft or clarification; Benson validates it before displaying it. It cannot execute tools.

MCPVault searches and reads notes. Approved writes use a small file-writing function because MCPVault's write tool cannot guarantee exclusive creation. Creating never replaces an existing filename, and appending requires an existing note. See [Obsidian](obsidian.md) for the review flow and limitations.

## Not Included in the MVP

- Continuous listening or meeting recording
- Deleting, renaming, or moving notes
- Calendar, task, email, or other connectors
- Windows support

These would add setup, security, and edge-case work without making the first demo stronger.

## Later Ideas

- Google Calendar events
- A better-looking application window
- Sounds and small animations
- More settings
- Windows support
- More connectors

## Sources

- [Ollama API](https://docs.ollama.com/api/introduction)
- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs)
- [Qwen3.5 4B in Ollama](https://ollama.com/library/qwen3.5:4b)
- [llama.cpp](https://github.com/ggml-org/llama.cpp)
