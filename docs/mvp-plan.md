# Benson MVP Plan

## Goal

- Finish the full MVP by **Friday, October 2, 2026**.
- Make one complete flow work well before adding extra features.

## How It Works

1. Record and save a short audio clip.
2. Use Parakeet to turn the audio into a transcript.
3. Use Qwen to choose an Obsidian note and prepare the content.
4. Show everything in a simple form so the user can make changes.
5. Ask for approval before sending anything to Obsidian.
6. Store every capture in SQLite so the audio and transcript are still there if something goes wrong.

The MVP is finished when all six steps work end to end.

## Basic App

- A small menu bar app for Mac
- A **Record** button
- A hotkey to start and stop recording
- An editable transcript and note preview
- A **Send to Obsidian** button
- A simple history list
- One Obsidian vault
- The default microphone

## Tools

- **Desktop app:** Electron, React, and TypeScript
- **Speech-to-text:** NVIDIA Parakeet TDT 0.6B v2
- **Speech runtime on Mac:** To be decided after testing a few options
- **Local model:** Qwen3.5 4B
- **Local storage:** SQLite
- **Destination:** Obsidian
- **Connector:** An Obsidian MCP

## Ollama or llama.cpp

- **Ollama** is easier to set up and already supports Qwen3.5 4B, so it goes first.
- **llama.cpp** gives the app more control over how the model runs, but it may take more setup.
- Both can be tested with the same examples before choosing one for the final version.

## Obsidian MCP

The first choice is an existing Obsidian MCP that is simple and maintained. If Benson needs its own, it only needs to:

- Find a note
- Create a note
- Add content to a note

The user reviews every change before it is sent.

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
