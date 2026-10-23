# Local Storage

Benson keeps each recording's date, audio path, transcript, and sent time in SQLite. The audio is saved as its own file.

The recording is saved before transcription, so it stays in History even if Parakeet fails.

Everything lives in `~/Library/Application Support/benson/`. The database is `benson.sqlite` and the audio is in `recordings/`. SQLite comes with Electron, so there is nothing extra to install.

History lists recordings newest first. Select one to play it and read its transcript. Audio recorded before the database was added does not show up.
