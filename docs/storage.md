# Local Storage

Benson uses SQLite to keep each new recording's date, file path, and transcript after the app closes. The audio stays in a separate file.

Benson saves the recording first, then adds the transcript when Parakeet finishes. If transcription fails, the recording is still saved.

The database is `benson.sqlite` in `~/Library/Application Support/benson/`. SQLite is included with Electron, so there is nothing extra to install.

The history list is next. Older audio files have not been added to the database yet.
