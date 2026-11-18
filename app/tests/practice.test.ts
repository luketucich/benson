import { test } from 'node:test'
import assert from 'node:assert/strict'
import { practiceDraft } from '../src/main/setup/practice.ts'
import type { NoteDraft } from '../src/noteDraft.ts'

const note = {
  action: 'create',
  category: 'Task',
  path: 'Personal/Reminders.md',
  content: '- [ ] Call Mom tomorrow',
  explanation: 'A new reminder.'
} as NoteDraft

test('practice notes go into Welcome to Benson, starting it the first time', () => {
  assert.deepEqual(practiceDraft(note, false), {
    ...note,
    path: 'Welcome to Benson.md',
    action: 'create'
  })
})

test('the second practice note is added to it', () => {
  assert.equal(practiceDraft(note, true).action, 'append')
  assert.equal(practiceDraft(note, true).path, 'Welcome to Benson.md')
})

test('a question from Benson is left alone', () => {
  const question = { ...note, action: 'clarify', explanation: 'Which list?' } as NoteDraft
  assert.deepEqual(practiceDraft(question, false), question)
})
