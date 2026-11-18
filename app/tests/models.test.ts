import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { qwenDownloaded, speechModelReady } from '../src/main/setup/models.ts'

function folder(): string {
  return mkdtempSync(join(tmpdir(), 'benson-models-'))
}

test('the speech model only counts once its weights are there', () => {
  const hub = folder()
  const snapshot = join(hub, 'models--mlx-community--parakeet-tdt-0.6b-v2/snapshots/abc')
  mkdirSync(snapshot, { recursive: true })
  writeFileSync(join(snapshot, 'config.json'), '{}')
  assert.equal(speechModelReady(hub), false)
  writeFileSync(join(snapshot, 'model.safetensors'), 'weights')
  assert.equal(speechModelReady(hub), true)
})

test('no speech model folder means not ready', () => {
  assert.equal(speechModelReady(folder()), false)
})

test('Qwen counts as downloaded when Ollama has its manifest, running or not', () => {
  const models = folder()
  assert.equal(qwenDownloaded(models, 'qwen3.5:4b'), false)
  const manifests = join(models, 'manifests/registry.ollama.ai/library/qwen3.5')
  mkdirSync(manifests, { recursive: true })
  writeFileSync(join(manifests, '4b'), '{}')
  assert.equal(qwenDownloaded(models, 'qwen3.5:4b'), true)
})
