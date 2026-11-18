import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Whether the two models are downloaded, by looking at the files themselves.
// That works whether or not Ollama is running yet, and catches a download
// that was quit halfway. Imports only Node, so the tests can load it.

// The speech model counts once its weights file is there, not just its config.
export function speechModelReady(huggingFaceHub: string): boolean {
  const snapshots = join(huggingFaceHub, 'models--mlx-community--parakeet-tdt-0.6b-v2', 'snapshots')
  if (!existsSync(snapshots)) return false
  return readdirSync(snapshots).some((revision) =>
    existsSync(join(snapshots, revision, 'model.safetensors'))
  )
}

// Ollama writes a model's manifest last, once every part of it has arrived.
export function qwenDownloaded(ollamaModels: string, model: string): boolean {
  const [name, tag] = model.split(':')
  return existsSync(join(ollamaModels, 'manifests/registry.ollama.ai/library', name, tag))
}
