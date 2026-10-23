# Obsidian

Benson uses [MCPVault](https://github.com/bitbonsai/mcpvault) to search and read notes in `~/Documents/Benson Vault`. It starts and stops with Benson. Obsidian does not need to be open. To see the notes, choose **Open folder as vault** in Obsidian and pick that folder.

## Review and send

1. Stop recording. Benson saves the audio and transcript, then asks Qwen for a draft.
2. Check the action, destination, and text. Edit them if needed.
3. Choose **Send** to save the note or **Cancel** to keep just the recording.

If a draft fails or Qwen asks a question, select the recording in History, add detail to the instructions, and choose **Prepare draft** again.

Drafts are not saved. Cancel, switching recordings, editing the instructions, or quitting clears the preview. The audio and transcript stay in History.

## How notes are written

MCPVault's write tool can replace whole files, so Benson writes approved drafts itself:

- **Create** fails if the note already exists.
- **Append** fails if the note is missing.
- Hidden paths, symbolic links, and paths outside the vault are blocked.

After a note is saved, History shows the sent time and that recording cannot be sent again. If the note saves but the timestamp does not, trying again only saves the timestamp.

## Qwen

Benson calls Ollama at `127.0.0.1:11434` with [structured outputs](https://docs.ollama.com/capabilities/structured-outputs), and checks the reply before showing it. Qwen sees up to five matching notes, 3,000 characters each. `Benson Inbox.md` is skipped.

Qwen can still pick the wrong note, add things I did not say, or miss a related note. Always check the preview.

## What I tested

On October 1 I tested grocery, project, new-topic, and vague requests. The full flow worked using computer-generated speech. Vague requests were hit or miss.

I also checked create, append, edits, Cancel, switching recordings, errors, retries, double clicks, and reopening the app, using a separate test vault. Testing with my own voice is still left.
