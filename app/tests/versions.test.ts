import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isAtLeast, parseVersion } from '../src/main/setup/versions.ts'

test('reads versions from each tool', () => {
  assert.equal(parseVersion('uv 0.13.7 (316c827e0 2026-11-03 aarch64-apple-darwin)'), '0.13.7')
  assert.equal(parseVersion('ollama version is 0.40.14'), '0.40.14')
  assert.equal(parseVersion('ffmpeg version 9.0.2 Copyright (c) 2000-2026'), '9.0.2')
  assert.equal(parseVersion('command not found'), null)
})

test('compares numerically, not as text', () => {
  assert.equal(isAtLeast('0.40.14', '0.40.0'), true)
  assert.equal(isAtLeast('0.9.9', '0.40.0'), false)
  assert.equal(isAtLeast('0.5.0', '0.5.0'), true)
})
