# Benson MVP Plan

## Goal

- Finish the full MVP by **Friday, October 2, 2026**.
- Make one complete flow work well before adding extra features.

## How It Works

1. Record and save a short audio clip.
2. Use Parakeet to turn the audio into a transcript.
3. Use Qwen to choose an Obsidian note and prepare the content.
4. Show the action, destination, and note text in a preview so the user can make changes.
5. Send only after approval, or cancel and keep the saved recording.
6. Keep the recording path, transcript, and successful sent time in SQLite. Store the audio separately.

The review preview is working. I finished and tested it on October 1 while catching up. Benson saves the audio and transcript first and waits for Send before writing a note. Drafts are not saved when switching recordings, changing the prompt, or closing the app.

The recording hotkey and more testing are still left for September 26-October 2. The flow worked with computer-generated speech, but I still need to try more of my own recordings.

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

Benson currently uses Ollama with `qwen3.5:4b`. Run `ollama serve`, then `ollama pull qwen3.5:4b` in another terminal. Qwen returns the action, path, text, and a short explanation, or asks for clarification. Benson checks the reply before showing it. Qwen cannot run tools or write notes.

MCPVault searches and reads notes. A small write function saves approved drafts because MCPVault's write tool can replace existing files. Creating a note fails if the name is taken. Appending requires an existing note. See [Obsidian](obsidian.md) for the details.

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
