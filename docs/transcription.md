# Local Transcription

This script runs a saved recording through Parakeet v2 and prints the text. It is separate from the app for now.

## Setup

Use an Apple Silicon Mac with [uv](https://docs.astral.sh/uv/getting-started/installation/) and FFmpeg installed.

```sh
brew install uv ffmpeg
```

## Run

From the Benson folder:

```sh
uv run scripts/transcribe.py "/path/to/recording.webm"
```

uv handles Python 3.12 and the script's dependencies. The first run also downloads the model. Later runs use the cached files. The recording stays on the Mac.

The script prints the transcript and reports model loading and transcription time separately. It leaves the original recording alone.

## What I Tested

- An 11-second Benson WebM recording transcribed offline in 0.49 seconds after the model was cached. Model loading took another 0.15 seconds.
- A computer-generated speech sample produced a transcript, but misheard "this Mac" as "the Smack." Accuracy needs more testing.
- Missing recordings and a missing FFmpeg installation show clear errors.

Source: [parakeet-mlx](https://github.com/senstella/parakeet-mlx).
