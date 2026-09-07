# Parakeet Research Notes

September 8, 2026

## What I Am Comparing

The goal is to find the best local Parakeet runtime for Benson on an Apple Silicon Mac. Windows support is useful later, but it should not decide the Mac MVP.

I checked the current README, MVP plan, recording code, and September 4 update. Benson uses Electron, React, and TypeScript. It saves WebM recordings. The planned model is Parakeet TDT 0.6B v2, and the runtime is still undecided.

This is documentation and source research. No runtimes or models have been installed or benchmarked for this review.

## First Pass

- Looked for Mac implementations using Core ML, MLX, and Metal, plus ONNX options for Windows.
- FluidAudio supports the exact v2 model and has a native library and command-line tool.
- parakeet-mlx is optimized for Apple Silicon. Python does not make its model execution unoptimized. The practical question is how much Python adds to setup and distribution.
- Found additional candidates beyond the original comparison: mlx-audio-swift, parakeet.cpp, parakeet-coreml-swift, and fluidaudio-web.
- Published speed numbers use different models, computers, audio lengths, and timing boundaries. They cannot be treated as one leaderboard.

Sources: [FluidAudio](https://github.com/FluidInference/FluidAudio), [parakeet-mlx](https://github.com/senstella/parakeet-mlx), [FluidAudio benchmarks](https://github.com/FluidInference/FluidAudio/blob/main/Documentation/Benchmarks.md), [another Core ML conversion](https://huggingface.co/mweinbach1/parakeet-tdt-0.6b-v3-coreml).

## Questions To Resolve

| Question | Current finding | Still checking |
| --- | --- | --- |
| Best fit for the Mac app | FluidAudio is the leading candidate | Actual compute settings, startup and packaging |
| Best MLX option | parakeet-mlx is a useful baseline | Current Swift alternatives and dependency requirements |
| Accuracy | v2 matches the English MVP | Whether comparisons use the same model and scoring |
| Speed | Published throughput looks sufficient | Short clip latency and cold starts are unverified |
| Windows | sherpa-onnx is a candidate | Model-specific acceleration and Electron support |
| Newer alternatives | Some have much higher advertised throughput | Whether their evidence applies to Benson |

## Follow-up Findings

### FluidAudio

The source was more useful than the headline description. The v2 pipeline uses a CPU preprocessor, then defaults to CPU and Neural Engine for the encoder, decoder, and joint stage. There is also an encoder GPU override. Core ML is not synonymous with Neural Engine, and choosing FluidAudio does not rule out using the GPU.

The current source describes a GPU speed improvement for a v3 encoder test. That is not proof of the same gain for v2. It also gives power efficiency on iOS as a reason for the default. Neither point establishes battery savings for Benson on Mac.

Sources: FluidInference, [AsrModels.swift](https://github.com/FluidInference/FluidAudio/blob/main/Sources/FluidAudio/ASR/Parakeet/SlidingWindow/TDT/AsrModels.swift), inspected at `5c19d5e`, August 30, 2026; [v0.15.6 source](https://github.com/FluidInference/FluidAudio/blob/v0.15.6/Sources/FluidAudio/ASR/Parakeet/SlidingWindow/TDT/AsrModels.swift) also checked. Confidence: high for configuration, unmeasured for Benson performance.

The package manifest requires Swift 6 and macOS 14. It includes native support code and a binary text-processing dependency, so it would be wrong to call it dependency-free. The shipping app would not need a Python environment for FluidAudio inference. A helper is our proposed Electron integration, not an integration already tested in this repo.

Sources: FluidInference, [Package.swift](https://github.com/FluidInference/FluidAudio/blob/v0.15.6/Package.swift), [ASR getting started](https://github.com/FluidInference/FluidAudio/blob/main/Documentation/ASR/GettingStarted.md). Confidence: high for requirements; packaging unverified.

The API defaults to v3. We must select v2 explicitly. The v2 download selected by the current source consists of Preprocessor, Encoder, Decoder, JointDecision, and the vocabulary file. Adding the 21 matching file sizes from Hugging Face gives 464,413,247 bytes, about 464 MB. The repository also contains older exports that are not part of this selection. Downloading the entire repository would give a misleading size.

Sources: FluidInference, [model names](https://github.com/FluidInference/FluidAudio/blob/main/Sources/FluidAudio/ModelNames.swift), [model metadata](https://huggingface.co/api/models/FluidInference/parakeet-tdt-0.6b-v2-coreml?blobs=true). Model revision `ee09c569`, updated September 25, 2025. Confidence: high for the calculated source-file total. Runtime memory, compilation caches, helper size, and final app size are still unknown.

The library supports loading staged models without a download. Its audio converter uses Apple's audio APIs. I did not find direct proof that Benson's current WebM files work through that path. Test one actual file before deciding whether to use FFmpeg or change the recording format.

Sources: FluidInference, [manual model loading](https://github.com/FluidInference/FluidAudio/blob/main/Documentation/ASR/ManualModelLoading.md), [AudioConverter.swift](https://github.com/FluidInference/FluidAudio/blob/main/Sources/FluidAudio/Shared/AudioConverter.swift). Confidence: high for the API, unresolved for WebM.

### MLX options

parakeet-mlx is a real Apple Silicon implementation. It uses Apple's MLX framework, which provides CPU and GPU execution with shared memory. It should not be described as a generic CPU implementation just because its interface is Python.

Its current package is 0.5.2 and requires Python 3.10 or newer. The audio loader invokes FFmpeg, including conversion to mono at the model's sample rate. It already handles conversion logic, but Benson would still need to locate or distribute the executable. v3 is the current default, so the v2 model must be selected explicitly.

Sources: Senstella, [README](https://github.com/senstella/parakeet-mlx), [package manifest](https://github.com/senstella/parakeet-mlx/blob/b78130e3aa1788e89707ec164adbea8865316aaf/pyproject.toml), [audio loader](https://github.com/senstella/parakeet-mlx/blob/b78130e3aa1788e89707ec164adbea8865316aaf/parakeet_mlx/audio.py); Apple, [MLX](https://github.com/ml-explore/mlx). Source revision `b78130e`, August 29, 2026. Confidence: high for implementation and requirements.

There are two different Swift projects to distinguish. FluidInference's old swift-parakeet-mlx says development moved to FluidAudio. That makes it a poor new dependency. Blaizzy's mlx-audio-swift is a separate, active project with Parakeet v2 and v3 support. Its current manifest requires Swift 6.2 and macOS 14, despite older requirements in its top-level README. It is a credible native MLX alternative, but I did not find a comparable Benson-style benchmark.

Sources: FluidInference, [old Swift port](https://github.com/FluidInference/swift-parakeet-mlx/blob/main/README.md); Blaizzy, [Parakeet support](https://github.com/Blaizzy/mlx-audio-swift/blob/main/Sources/MLXAudioSTT/Models/Parakeet/README.md), [manifest](https://github.com/Blaizzy/mlx-audio-swift/blob/bf14ae0c26e4e85553dd989571cae29d70fa6735/Package.swift), revision `bf14ae0`, September 3, 2026. Confidence: high for documented support; comparative performance unknown.

The Python [mlx-audio toolkit](https://github.com/Blaizzy/mlx-audio) also supports Parakeet. It is broader than Benson needs and retains Python. I found no clear reason to choose it over the focused parakeet-mlx package for this first comparison.

### Other Mac candidates

- [mudler/parakeet.cpp](https://github.com/mudler/parakeet.cpp) uses C++ and ggml. It supports the exact v2 model, a Metal backend, a C API, and Windows builds. Python is used for model conversion, not inference. This is a serious alternative if sharing one implementation across platforms becomes important. Source checked at `e75de9b`, August 18, 2026.
- [mweinbach/parakeet-coreml-swift](https://github.com/mweinbach/parakeet-coreml-swift) is a smaller native Core ML library with selectable CPU, GPU, and Neural Engine execution. Its documented model is v3. The repository metadata showed its last push on April 22, 2026. A narrower library is appealing, but its limited comparison evidence does not displace FluidAudio for this v2 project.
- [fluidaudio-web](https://github.com/FluidInference/fluidaudio-web) is different from FluidAudio's native library. It uses WebGPU and WASM and documents Parakeet v3. It could fit an Electron renderer, but browser compatibility, worker memory, and Benson's Chromium version would need testing. Its benchmark page mixes older ONNX harness results with newer browser measurements, so the execution path matters.
- [Frikallo/parakeet.cpp](https://github.com/Frikallo/parakeet.cpp) is a different project from mudler's. Its headline 27 ms result is an encoder test for a smaller 110M model using generated input. That is not complete v2 transcription, so it did not influence the recommendation.

Confidence: high that these projects exist and document these paths. None was installed or tested for Benson.

### Windows and cross-platform options

sherpa-onnx supplies converted v2 models and the speech processing around them. Its Node installation guide lists Mac x64 and arm64, Windows x64, and Linux x64 and arm64. The broader library supports more platforms than that particular package. The v2 example explicitly uses CPU. That is a useful baseline, not proof of Mac GPU or Neural Engine support.

Sources: k2-fsa, [Node installation](https://k2-fsa.github.io/sherpa/onnx/javascript-api/install.html), [v2 model and example](https://k2-fsa.github.io/sherpa/onnx/pretrained_models/offline-transducer/nemo-transducer-models.html#sherpa-onnx-nemo-parakeet-tdt-0-6b-v2-int8-english). Confidence: high for documented support; packaged Electron behavior unverified.

Plain ONNX Runtime is lower level. It does not supply the full Parakeet audio preparation and token decoding flow by itself. The prebuilt Node table lists CPU on Mac and DirectML on Windows, with no Core ML row. ONNX Runtime having a Core ML backend elsewhere does not mean this Node package automatically uses it.

Sources: Microsoft, [Node binding](https://onnxruntime.ai/docs/get-started/with-javascript/node.html); Istupakov, [onnx-asr implementation](https://github.com/istupakov/onnx-asr). Confidence: high for the published package table, not a universal statement about custom builds.

onnx-asr adds audio preparation and decoding through Python without needing PyTorch. It supports v2 and v3 and offers several hardware backends. Its installation matrix is not proof that every model export is fast or fully supported on every backend. Its benchmark machines are AMD, NVIDIA, and an Orange Pi, not Macs.

Sources: Istupakov, [installation](https://istupakov.github.io/onnx-asr/installation/), [benchmarks](https://istupakov.github.io/onnx-asr/benchmarks/). Confidence: high for documentation; Mac performance unresolved.

NVIDIA's current NeMo Speech project is useful as the original implementation for comparison. It allows CPU PyTorch and recommends CUDA for inference. It would be too broad to say NeMo cannot run without an NVIDIA GPU. Its Python and PyTorch dependencies still make it a less appealing desktop runtime for this project.

Source: NVIDIA, [NeMo Speech](https://github.com/NVIDIA-NeMo/Speech). Confidence: high for documented requirements. Exact native Mac and Windows installation behavior was not tested.

## Benchmark Review

RTFx means audio duration divided by processing time. A result of 100x means the measured code processed 100 seconds of audio per second. It does not include unmeasured model downloads, startup, or app work. WER means word error rate and should be measured against a human transcript.

| Source | What was measured | Why it does not settle the choice |
| --- | --- | --- |
| [FluidAudio benchmarks](https://github.com/FluidInference/FluidAudio/blob/main/Documentation/Benchmarks.md) | v2, M4 Pro with 48 GB RAM, 2,620 LibriSpeech files, 2.1% average WER and 145.8x overall RTFx | Author results on read speech. The current benchmark source loads models before timing file transcription. No Benson startup or UI timing. |
| [parakeet-mlx discussion](https://github.com/senstella/parakeet-mlx/discussions/15) | Version 0.2.7, May 16, 2025, M2 Air with 16 GB RAM, five long files, roughly 33 to 39x | Older version and different hardware. The linked script excludes model loading but does not explicitly warm up inference. No accuracy result. |
| [mudler Metal benchmark](https://github.com/mudler/parakeet.cpp/blob/e75de9b6b9b688fd293aa22f7e27aa724ea286f8/benchmarks/BENCHMARK.md#apple-metal-m4) | M4, v2 q4_k, 7.4-second clip, 57.1x, best of six steady-state runs | One clip, different precision, loading and compilation excluded. Matching NeMo output is not perfect human-reference accuracy. |
| [mweinbach Core ML model card](https://huggingface.co/mweinbach1/parakeet-tdt-0.6b-v3-coreml) | M5 Max, v3, one 17.5-minute speech, three-run medians, up to 1145x on GPU | Long-file pipeline throughput. Its reported WER is against an fp16 reference output, not a human transcript. |
| [mac-whisper-speedtest](https://github.com/anvanvan/mac-whisper-speedtest) | Example shows FluidAudio at 0.1935 seconds and parakeet-mlx at 0.4995 seconds | Example lacks enough shared hardware and clip context. Native bridge timing excludes bridge overhead. Not a reliable speed ranking. |
| [fluidaudio-web benchmarks](https://github.com/FluidInference/fluidaudio-web/blob/main/docs/BENCHMARKS.md) | Warm Chrome/macOS WebGPU v3 sample, 259 ms for 12 seconds | Inference only, v3, specific browser path. Larger-file headline numbers use a different workload. |
| [NVIDIA v2 model card](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2) | Headline 3380x at batch size 128 | A large batch result cannot predict one voice note on a laptop. |

FluidAudio's [current benchmark code](https://github.com/FluidInference/FluidAudio/blob/main/Sources/FluidAudioCLI/Commands/ASR/Parakeet/SlidingWindow/AsrBenchmark.swift) was checked to separate loading from transcription timing. The published results do not identify a matching source revision, so this does not fully reconstruct the historical run.

The onnx-asr CPU table also reports v2 fp32 faster than int8 on its Ryzen machine. Smaller model files do not automatically mean faster transcription. That is another reason to keep precision visible in a comparison.

## Problems and Limits Checked

FluidAudio has reports of dropped sentences, chunk boundary problems, and repeated transcription crashes. Issues [128](https://github.com/FluidInference/FluidAudio/issues/128), [320](https://github.com/FluidInference/FluidAudio/issues/320), and [760](https://github.com/FluidInference/FluidAudio/issues/760) were all closed when checked. A closed issue alone does not prove every related case is fixed.

Issue 760 concerns the v3 export and includes a Ukrainian short-audio example. It should not be presented as a confirmed v2 English defect. It is still a useful reminder to test short clips, longer notes, and missing words. The [v0.15.6 release](https://github.com/FluidInference/FluidAudio/releases/tag/v0.15.6) contains ASR and model-download fixes, which supports pinning a release and testing it instead of copying an old setup guide.

I excluded Kokoro and other text-to-speech crashes from the Parakeet assessment. They concern different models. I also did not use iPhone compilation times as Mac startup estimates.

No source establishes Benson's battery use, peak memory, first-run preparation time, or behavior while Qwen is loaded. Neural Engine execution could reduce GPU contention, but Benson's planned transcription and Qwen steps are sequential. That benefit is a possibility, not a measured reason to promise better performance.

## Model and License Choice

Keep v2 for the first test because Benson currently needs English and already names this model. v3 and the newer Unified or streaming models are separate choices. They should not be silently substituted while comparing runtimes.

The FluidAudio runtime is Apache 2.0. NVIDIA's v2 model is CC-BY-4.0. Keep the runtime notices and model attribution with the app. Neither requires a hosted transcription API for local inference.

Sources: [FluidAudio license](https://github.com/FluidInference/FluidAudio/blob/main/LICENSE), [NVIDIA v2 model card](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2). Both read September 8, 2026.

## Search Record

Main discovery searches included:

- `Parakeet mac native runtime CoreML MLX best benchmark`
- `site:github.com Parakeet CoreML FluidAudio benchmark MLX`
- `site:github.com FluidAudio Electron parakeet`
- `site:github.com/FluidInference/FluidAudio issues parakeet macOS latency cpuAndNeuralEngine`
- `site:github.com/FluidInference/FluidAudio Intel`

Follow-up work read the exact model cards, package manifests, source loaders, benchmark scripts, release metadata, and issue states linked above. The MLX and cross-platform reviews checked their own project documentation and manifests. GitHub API metadata was used for revision dates, rather than search crawl dates.

Some searches returned NeMo Agent Toolkit or NemoClaw documentation. Those are different products and were not used to establish NeMo Speech compatibility. Forum posts and app marketing were discovery leads, not evidence of a speed winner.

All linked sources were accessed on September 8, 2026. Most documentation pages do not give a publication date. Where a revision or release date could be verified, it is recorded above. Links to `main` may change after this review.

## Final Decision and Remaining Questions

FluidAudio is the best-supported choice for Benson's current Mac scope. parakeet-mlx is the first alternative to measure against it. mlx-audio-swift is another native candidate if the Core ML path has problems. Windows can be revisited with sherpa-onnx and parakeet.cpp.

| Question | Result | Next check |
| --- | --- | --- |
| Does it support the intended Mac and v2 model? | Documented and confirmed in source | Run one real recording |
| Can it fit Electron without Python? | A native helper is a reasonable approach | Build and package the helper |
| Is it the fastest option for Benson? | Not established by public benchmarks | Same recordings and Mac, including startup and Stop-to-text time |
| Will it preserve the words correctly? | Published accuracy is encouraging | Human transcripts, names, noise, silence, repeated notes |
| Does current WebM input work? | Unverified | Test direct loading and conversion |
| What will it cost in memory and battery? | Unmeasured | Measure the app after repeated captures |

Research stopped once the main candidates, platform differences, source requirements, and benchmark limits were covered. More search results would not resolve the remaining questions as well as testing Benson's own recordings.
