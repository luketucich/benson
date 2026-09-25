# Obsidian

Benson uses [MCPVault](https://github.com/bitbonsai/mcpvault) to search and read notes in `~/Documents/Benson Vault`. It starts with Benson and stops when the app quits. Obsidian does not need to be open, and no plugin is needed. To see the notes, choose **Open folder as vault** in Obsidian and select that folder.

## Review and send

1. Stop recording. Benson saves the audio and transcript, then asks Qwen to prepare a note.
2. Check the action, destination, and note text. Edit the destination or text if needed.
3. Choose **Send** to save the note or **Cancel** to keep just the recording.

There is no automatic Inbox send anymore. Select an unsent recording in History and choose **Prepare draft** to try again. If Qwen needs more detail, add it to the Qwen prompt and prepare another draft.

Creating a note fails if the filename is taken. Appending fails if the note is missing. Permission errors are shown separately. A small write function handles this because MCPVault's write tool can replace existing files. Hidden paths, symbolic links, and paths outside the vault are blocked.

History shows the sent time after a successful write. A recording marked as sent cannot be sent again. If the note is saved but its timestamp fails, a retry in the same app session only saves the timestamp. If the app crashes between those steps, check the vault before trying again.

Drafts and edits are not saved. Cancel, switching recordings, changing the prompt, or closing the app clears the preview. The audio and transcript stay in History.

## Qwen

Run `ollama serve`, then `ollama pull qwen3.5:4b` in another terminal. Benson calls Ollama at `127.0.0.1:11434` using [structured outputs](https://docs.ollama.com/capabilities/structured-outputs). Empty or invalid replies cannot be sent.

Qwen gets up to five matching notes, with up to 3,000 characters from each. `Benson Inbox.md` is skipped because older recordings may already be there. Search can miss related wording or return unrelated notes. Qwen can also guess the wrong destination, add details that were not said, or describe a note as saved before it is. Always check the preview. Vague requests were inconsistent in testing.

## What I tested

I tested grocery, project, new-topic, and unclear requests on October 1. Searching and preparing drafts left the test vault unchanged. The full recording, transcription, preview, and Send flow worked with computer-generated speech and the local models.

I also checked creating and appending, edits, Cancel, switching recordings, errors, retry, repeated clicks, and reopening the app. These checks used a separate database and vault. Some used fixed model replies or forced errors to check recovery. They do not prove Qwen's accuracy.

The build, lint, and formatting checks passed. The recording hotkey and more testing with my own speech are still left to do.
