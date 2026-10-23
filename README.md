# Benson

Benson is a Mac app for saving a quick thought without leaving what you are doing. Record a voice note, check what Benson made of it, and send it to Obsidian. The scope is in the [MVP plan](docs/mvp-plan.md).

## Run locally

You need an Apple Silicon Mac, Node.js, [Ollama](https://ollama.com), and the [transcription setup](docs/transcription.md). Start Ollama with `ollama serve`, then run this from the Benson folder in another terminal:

```sh
ollama pull qwen3.5:4b
cd app
npm install
npm run dev
```

Record a note and stop. Benson saves the audio, transcribes it, and Qwen drafts a note. Check the destination and text, edit if needed, then choose **Send** or **Cancel**. Nothing goes to Obsidian until you choose Send.

## Recording shortcut

Click **Set shortcut** and press something like **Control + Option + Space**. Hold it from any app to record and release it to stop. The review window opens when the draft is ready.

Closing the window keeps Benson running in the menu bar. Click the icon to reopen it, or choose **Quit Benson**. Building the shortcut needs Apple's Command Line Tools.

## Documents

- [MVP plan](docs/mvp-plan.md)
- [Local transcription](docs/transcription.md)
- [Local storage](docs/storage.md)
- [Obsidian](docs/obsidian.md)
- [Weekly updates](https://github.com/luketucich/benson/wiki)
- [Meeting notes](docs/meeting-notes/)

## Code layout

- `app/src/main/`: The Electron side. `index.ts` starts Benson, `ipc.ts` lists every request the screen can make, and each other file handles one piece.
- `app/src/main/recordingShortcut/`: The global shortcut. `keys.ts` maps keys to Mac numbers, `helper.ts` runs the small program in `app/native/`, and `index.ts` saves the setting.
- `app/src/preload/`: What the screen can call through `window.api`.
- `app/src/renderer/src/`: The React screen. `hooks/` has the recorder, history, and shortcut, and `components/` has the pieces you see.
- `app/src/*.ts`: Types and checks both sides share.
- `scripts/transcribe.py`: Runs Parakeet.

## Timeline

I meet with my professor on Thursdays and send a weekly update every Friday.

| Week                   | Main goal                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| August 26-September 4  | Set up the GitHub repository, project environment, templates, and documentation. Build the basic menu bar and recording window, then save audio locally. |
| September 5-11         | Add Parakeet transcription, SQLite storage, and a simple history list.                                                                                   |
| September 12-18        | Connect Obsidian and test sending transcripts.                                                                                                           |
| September 19-25        | Add Qwen and have it prepare an Obsidian note for review.                                                                                                |
| September 26-October 2 | Add the recording hotkey, test the full MVP more broadly, and resolve remaining issues.                                                                  |
| October 3-9            | Catch up on anything unfinished and write up the MVP before the Korea trip.                                                                              |
| October 10-16          | No project work planned. Korea trip and UNC Charlotte fall break (October 12-13).                                                                        |
| October 17-23          | Clean up the code, split it into smaller files, and simplify the screen.                                                                                 |
| October 24-30          | Test the MVP with my own recordings and write it up. Then improve the main window, menu bar, history, loading screens, and error messages.               |
| October 31-November 6  | Add small UI improvements, sounds, animations, and a simple mute option.                                                                                 |
| November 7-13          | Ask 3 friends to try Benson and note what confuses them or does not work.                                                                                |
| November 14-20         | Fix the biggest issues from testing and ask a few more people to try it if time allows.                                                                  |
| November 21-27         | Finish the documentation and compare Benson with similar apps.                                                                                           |
| November 28-December 4 | Build and practice the live demo and 30-minute presentation.                                                                                             |
| December 5-11          | Give the final presentation and finish any remaining class materials.                                                                                    |
