# Obsidian

Benson starts [MCPVault](https://github.com/bitbonsai/mcpvault) for `~/Documents/Benson Vault` and uses it to search and read Markdown notes. It runs with Electron's Node.js and stops when Benson quits. Obsidian does not need to be open and no plugin is required. To see the notes, choose **Open folder as vault** in Obsidian and select that folder.

## Review and send

1. Stop recording. Benson saves the audio and transcript before asking Qwen for a draft.
2. Review the category, action, destination, note text, and explanation. Correct the destination or text if needed.
3. Choose **Send** to create or append, or **Cancel** to discard the preview and keep the recording.

Nothing is added to Obsidian before Send. There is no automatic Inbox send. An unsent History entry has **Prepare draft**; a failed generation has **Retry draft**. If Qwen asks for clarification, edit the Qwen prompt with the missing details and prepare again.

Creating a note fails if the filename already exists. Appending fails if the note is missing. Permission errors are reported separately. Approved writes use exclusive creation or append-only file access because MCPVault's write tool does not provide those guarantees. Paths must stay inside the vault; hidden paths and symbolic links are rejected.

Only a successful write updates the sent time in History. Repeated clicks and retries after a completed send cannot send that recording again. If saving the timestamp fails after writing, retrying in the same app session only retries the timestamp. A crash between writing and saving the timestamp is not recovered automatically; check the vault before trying again after a crash.

Drafts and edits are not persisted. Cancel, switching recordings, changing the prompt, or restarting clears the preview. The saved audio and transcript remain available.

## Qwen and search limits

Run Ollama with `ollama serve`, then install the model with `ollama pull qwen3.5:4b` in another terminal. Benson calls the local service at `127.0.0.1:11434` using [structured outputs](https://docs.ollama.com/capabilities/structured-outputs). Empty or invalid replies do not become sendable drafts.

Search supplies at most five matches and 3,000 characters per note, excluding `Benson Inbox.md` because older recordings may already be there. Word matching can miss relevant notes or include unrelated ones. Qwen can still choose a new note when an existing one fits, invent details, or phrase a proposal as though it was already saved. Only the app's successful Send confirms a write. Vague requests produced inconsistent guesses in testing, even with clarification instructions.

## Checks run during catch-up on October 1

- Grocery, project, new-topic, and unclear examples with local Qwen; searching and generating left the test vault unchanged.
- The real Electron recording → Parakeet → Qwen → preview → Send flow using synthetic microphone audio, a separate database, and a test vault. This created a new note; it is not a real-microphone accuracy test.
- Create and append, edited previews, Cancel, switching recordings, clarification, malformed replies, unavailable service, conflicts, missing targets, invalid paths, permission failures, retry, repeated clicks, and restart behavior. Recovery cases used controlled model replies or injected failures with real SQLite and test-vault writes.

The build, TypeScript checks, ESLint, and changed-file formatting checks passed. The recording hotkey and broader MVP testing remain separate work.
