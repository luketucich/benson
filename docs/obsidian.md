# Obsidian

Benson uses [MCPVault](https://github.com/bitbonsai/mcpvault) to search and read notes in the vault you choose during setup: **Make a vault for me** creates `~/Documents/Benson Vault`, and **Use my vault** picks an existing one. You can change it later under **Obsidian vault** in settings (the gear at the bottom left). It starts and stops with Benson. Obsidian does not need to be open. To see the notes, choose **Open folder as vault** in Obsidian and pick that folder.

## Review and send

Each recording opens as a conversation: what you said, with a player for the audio, then Benson's reply.

1. Stop recording. Benson saves the audio and transcript, then asks Qwen for a draft.
2. Check the destination and text. **Choose File...** offers **Add to a Note...**, which opens the Mac's file picker in your vault, or **New Note...**, which lets you name a new one.
3. Choose **Save to Obsidian** (or press ⌘↩) to save the note, or **Discard** to keep just the recording.

If Benson asks a question, answer in the reply box at the bottom by typing or with the mic, or hold your shortcut while the question is on screen. Benson tries again with your answer, and both stay in the conversation.

While Benson is working, the mic button becomes **Stop**. Press it, or your shortcut, to stop Benson, and choose **Continue** later to pick up where it left off.

Recordings made with the shortcut show the same reply in a small panel at the bottom of the screen, with the same buttons. **Open** shows it in the main window, and Esc closes the panel and leaves the reply there for later.

Replies are kept with the recording, so a draft is still there after switching recordings or quitting. If Benson couldn't answer, choose **Continue**. After discarding a draft, reply in the box to ask for another.

To remove a recording, hover over it in History and choose **...**, then **Delete Recording**, or right-click it. Its audio, and any spoken answers, go to the Trash.

## How notes are written

MCPVault's write tool can replace whole files, so Benson writes approved drafts itself:

- **Create** fails if the note already exists.
- **Append** fails if the note is missing.
- Hidden paths, symbolic links, and paths outside the vault are blocked.

After a note is saved, History shows the sent time and that recording cannot be sent again. If the note saves but the timestamp does not, trying again only saves the timestamp.

## Qwen

Benson starts Ollama when it opens if it isn't already running, then calls it at `127.0.0.1:11434` with [structured outputs](https://docs.ollama.com/capabilities/structured-outputs), and checks the reply before showing it. Search leaves out filler words like "to" and "my", and Benson also checks note names and dates. Qwen sees up to five matching notes, about 3,000 characters each with long ones cut in the middle, plus the date, the week number, and the vault's folders. `Benson Inbox.md` is skipped.

Qwen can still pick the wrong note, add things I did not say, or miss a related note. Always check the preview.

## What I tested

On October 1 I tested grocery, project, new-topic, and vague requests. The full flow worked using computer-generated speech. Vague requests were hit or miss.

I also checked create, append, edits, Cancel, switching recordings, errors, retries, double clicks, and reopening the app, using a separate test vault. Testing with my own voice is still left. See [edge case testing](testing/edge-cases.md) for what happens with messier vaults.
