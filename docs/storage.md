# Local Storage

Benson uses SQLite to keep each new recording's date, file path, and transcript after the app closes. The audio stays in a separate file.

Benson saves the recording first, then adds the transcript when Parakeet finishes. If transcription fails, the recording is still saved.

The database is `benson.sqlite` in `~/Library/Application Support/benson/`. SQLite is included with Electron, so there is nothing extra to install.

History shows saved recordings, newest first. Select one to play the audio and read its transcript. Older audio files have not been added to the database yet.

After a successful send to Obsidian, Benson saves the time and shows it in History. A recording with a saved sent time cannot be sent again from the preview. Sends made before sent tracking was added were not tracked.

Drafts and preview edits live only in memory. Cancel, switching recordings, changing the prompt, and restarting discard the draft without removing the saved audio or transcript.
