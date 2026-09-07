# Parakeet Runtime Research

## What I Picked

I am starting with **parakeet-mlx and Parakeet TDT 0.6B v2**. It is straightforward to set up, optimized for Apple Silicon, and keeps me focused on getting the recording flow working. I still need to test its speed on my own recordings.

## Why I Need a Runtime

Parakeet knows how to turn speech into text, but Benson needs software to run it. That software is called a runtime. I give parakeet-mlx a recording, it runs Parakeet on the Mac, and it sends the text back to Benson.

## Options I Looked At

- **[parakeet-mlx](https://github.com/senstella/parakeet-mlx):** Easy to try and optimized for Mac, but needs Python and FFmpeg.
- **[FluidAudio](https://github.com/FluidInference/FluidAudio):** Fast in published Mac tests and avoids Python, but takes more Swift setup to connect to Benson.
- **[mlx-audio-swift](https://github.com/Blaizzy/mlx-audio-swift):** Uses MLX without Python, but adds Swift setup and has less speed data to compare.
- **[parakeet.cpp](https://github.com/mudler/parakeet.cpp):** Has ready-made Mac and Windows programs, but its Mac speed test only covers one short clip.
- **[sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx):** Works with Node on Mac and Windows, but I found less evidence of Mac acceleration for Parakeet v2.
- **[parakeet-coreml-swift](https://github.com/mweinbach/parakeet-coreml-swift):** Has promising Mac speed results, but needs Swift setup and uses v3 instead of my planned v2 model.
- **[onnx-asr](https://github.com/istupakov/onnx-asr):** Simple Python setup for CPU use, but Mac speed is still unclear.
- **[NeMo](https://github.com/NVIDIA-NeMo/Speech):** NVIDIA's original framework, but its Python and PyTorch setup is more than I need right now.

## Why I Picked MLX

The goal is to get Benson working from recording to Obsidian. MLX gives me a simple way to add local transcription without building a Swift helper first. The downside is managing Python and FFmpeg when I share the app. FluidAudio is worth revisiting if that becomes a problem.
