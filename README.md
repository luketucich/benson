# Benson

Benson is a desktop app for saving a quick thought without leaving what you are working on. Record a voice note, review what Benson understood, and send it to Obsidian. The full scope is in the [MVP plan](docs/mvp-plan.md).

## Run locally

Use an Apple Silicon Mac, Node.js, and the [transcription setup](docs/transcription.md). Install [Ollama](https://ollama.com), start it with `ollama serve`, then download the model in another terminal:

```sh
ollama pull qwen3.5:4b
cd app
npm install
npm run dev
```

Stop a recording to save the audio and transcript and prepare a draft. Review its action, destination, and note text; edit the destination or text if needed, then choose **Send** or **Cancel**. Obsidian writing waits for Send. Saved recordings remain in History if drafting or sending fails.

The preview is implemented. Drafts and preview edits are not saved across restarts or recording changes. Qwen can guess incorrectly and search can miss relevant notes; see [Obsidian](docs/obsidian.md) for limits and test coverage. The recording hotkey and broader MVP testing remain separate September 26–October 2 work.

## Documents

- [MVP plan](docs/mvp-plan.md)
- [Local transcription](docs/transcription.md)
- [Local storage](docs/storage.md)
- [Obsidian](docs/obsidian.md)
- [Weekly updates](https://github.com/luketucich/benson/wiki)
- [Meeting notes](docs/meeting-notes/)

## Code Layout

- `app/src/main/`: Window, recording files, SQLite storage, and the Obsidian connection.
- `app/src/preload/`: Functions the screen can call through `window.api`.
- `app/src/renderer/src/`: The React screen and `styles.css`.
- `app/src/recording.ts`: The fields shared by saved recordings.
- `scripts/transcribe.py`: The Python script that runs Parakeet.

## Timeline

The goal is to finish the full MVP by **Friday, October 2, 2026**. Weekly meetings with my professor happen on Wednesdays, and a weekly update goes out every Friday.

| Week                   | Main goal                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| August 26-September 4  | Set up the GitHub repository, project environment, templates, and documentation. Build the basic menu bar and recording window, then save audio locally. |
| September 5-11         | Add Parakeet transcription, SQLite storage, and a simple history list.                                                                                   |
| September 12-18        | Connect Obsidian and test sending transcripts.                                                                                                           |
| September 19-25        | Add Qwen and have it prepare an Obsidian note for review.                                                                                                |
| September 26-October 2 | Add the recording hotkey, test the full MVP more broadly, and resolve remaining issues.                                                                  |
| October 3-9            | Catch up on anything unfinished and write up the MVP before the Korea trip.                                                                              |
| October 10-16          | No project work planned. Korea trip and UNC Charlotte fall break (October 12-13).                                                                        |
| October 17-23          | Fix anything noticed after the break and try creating a reviewed Google Calendar event. Save it for later if it takes too long.                          |
| October 24-30          | Improve the main window, menu bar, history, loading screens, and error messages.                                                                         |
| October 31-November 6  | Add small UI improvements, sounds, animations, and a simple mute option.                                                                                 |
| November 7-13          | Ask 3 friends to try Benson and note what confuses them or does not work.                                                                                |
| November 14-20         | Fix the biggest issues from testing and ask a few more people to try it if time allows.                                                                  |
| November 21-27         | Finish the documentation and compare Benson with similar apps.                                                                                           |
| November 28-December 4 | Build and practice the live demo and 30-minute presentation.                                                                                             |
| December 5-11          | Give the final presentation and finish any remaining class materials.                                                                                    |
