# Benson

Benson is a Mac app for saving a quick thought without leaving what you are doing. Record a voice note, check what Benson made of it, and send it to Obsidian. The scope is in the [MVP plan](docs/mvp-plan.md).

## Run locally

You need an Apple Silicon Mac and Node.js. Run this from the Benson folder:

```sh
cd app
npm install
npm run dev
```

The first time, Benson walks you through setup: it downloads what it needs (uv, FFmpeg, Ollama, the Qwen writing model, and the speech model) into its own folder, skipping anything already installed. Then you pick a vault, your microphone and speaker, and a shortcut, and try two practice notes, which go into `Welcome to Benson.md`. Benson starts Ollama itself when it opens, and stops it on quit unless Ollama was already running.

To see onboarding again while developing, run `BENSON_ONBOARDING=1 npm run dev`. `BENSON_PRETEND_MISSING=uv,ffmpeg` makes those pieces look missing, so their downloads can be tested. `npm test` runs the tests.

Record a note and stop. Benson saves the audio, transcribes it, and Qwen drafts a note. Check where it goes and what it says, edit if needed, then choose **Save to Obsidian** or **Discard**. Nothing goes to Obsidian until you choose Save to Obsidian. A short sound plays when recording starts and stops, and when a note is saved.

## Recording shortcut

Open settings with the gear at the bottom left, choose **Change**, and press something like **Control + Option + Space**. Function keys and the keypad's **Clear** key also work on their own. Hold it from any app to record and release it to stop. A small panel at the bottom of the screen shows the progress, then the draft, so you can save it without leaving what you're doing.

Closing the window keeps Benson running in the menu bar and takes it out of the Dock. Click the menu bar icon and choose **Open Benson** or **Quit Benson**. Building the shortcut needs Apple's Command Line Tools.

In development, `npm run dev` renames its copy of Electron to Benson.app so the Dock shows Benson's name and icon.

## Documents

- [MVP plan](docs/mvp-plan.md)
- [Local transcription](docs/transcription.md)
- [Local storage](docs/storage.md)
- [Obsidian](docs/obsidian.md)
- [Edge case testing](docs/testing/edge-cases.md)
- [Weekly updates](https://github.com/luketucich/benson/wiki)
- [Meeting notes](docs/meeting-notes/)

## Code layout

- `app/src/main/`: The Electron side. `index.ts` starts Benson, `ipc.ts` lists every request the screen can make, `conversation.ts` keeps the back-and-forth with Benson, and each other file handles one piece.
- `app/src/main/recordingShortcut/`: The global shortcut. `keys.ts` maps keys to Mac numbers, `helper.ts` runs the small program in `app/native/`, and `index.ts` saves the setting.
- `app/src/preload/`: What the screen can call through `window.api`.
- `app/src/renderer/src/`: The React screen. `hooks/` has the recorder, history, shortcut, and panel, `components/` has the pieces you see, `panel/` is the floating panel for shortcut recordings, and `styles/` is split by part of the app.
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
| November 7-13          | Finish the dialog box, a small floating window for recordings made with the shortcut.                                                                    |
| November 14-20         | Finish onboarding, so a new person can set up Benson on their own, and get ready for testers.                                                            |
| November 21-27         | Thanksgiving. Have family and friends try Benson and note what confuses them or does not work.                                                           |
| November 28-December 4 | Fix the biggest issues from testing, finish the documentation, and build and practice the live demo and 30-minute presentation.                         |
| December 5-11          | Give the final presentation and finish any remaining class materials.                                                                                    |
