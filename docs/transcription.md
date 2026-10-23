# Local Transcription

Benson runs each recording through Parakeet v2 on the Mac. Nothing leaves the computer.

## Setup

You need an Apple Silicon Mac with [uv](https://docs.astral.sh/uv/getting-started/installation/) and FFmpeg.

```sh
brew install uv ffmpeg
```

## Run it on its own

From the Benson folder:

```sh
uv run scripts/transcribe.py "/path/to/recording.webm"
```

uv sets up Python 3.12 and the dependencies. The first run downloads the model, and later runs use the cached copy. The script prints the transcript and how long loading and transcribing took.

## What I tested

- An 11-second recording took 0.49 seconds to transcribe once the model was cached. Loading took another 0.15 seconds.
- Computer-generated speech worked but heard "this Mac" as "the Smack." Accuracy needs more testing.
- A missing recording or missing FFmpeg shows a clear error.

I picked parakeet-mlx over the other runtimes. See [Parakeet runtime](research/parakeet-runtime.md) for why.
