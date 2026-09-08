# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["parakeet-mlx==0.5.2"]
# ///

import argparse
from pathlib import Path
import shutil
import sys
from time import perf_counter


def main() -> int:
    parser = argparse.ArgumentParser(description="Transcribe a saved Benson recording.")
    parser.add_argument("recording", type=Path, help="Path to an audio file")
    args = parser.parse_args()

    if not args.recording.is_file():
        parser.error(f"Recording not found: {args.recording}")
    if shutil.which("ffmpeg") is None:
        parser.error("FFmpeg is missing. Install it with: brew install ffmpeg")

    from parakeet_mlx import from_pretrained

    try:
        print("Loading Parakeet v2...", file=sys.stderr)
        started = perf_counter()
        model = from_pretrained("mlx-community/parakeet-tdt-0.6b-v2")
        print(f"Model ready in {perf_counter() - started:.2f}s", file=sys.stderr)

        started = perf_counter()
        result = model.transcribe(str(args.recording.resolve()))
        print(f"Transcribed in {perf_counter() - started:.2f}s", file=sys.stderr)
        print(result.text)
    except Exception as error:
        print(f"Transcription failed: {error}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
