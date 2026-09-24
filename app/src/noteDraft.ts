export interface NoteDraft {
  action: 'create' | 'append' | 'clarify'
  category: 'Task' | 'Idea' | 'Reference' | 'Journal' | 'Unclear'
  path: string
  content: string
  explanation: string
}

export function validateNotePath(path: string): void {
  const parts = path.split('/')
  if (
    !path.endsWith('.md') ||
    path.length > 240 ||
    /[\\:]/.test(path) ||
    [...path].some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
    ) ||
    parts.some((part) => !part || part.startsWith('.') || part.trim() !== part)
  ) {
    throw new Error('Use a relative Markdown path, such as Projects/Benson.md, inside the vault.')
  }
}

export function validateDraft(value: unknown): NoteDraft {
  if (!value || typeof value !== 'object') throw new Error('Qwen did not return a note draft.')
  const draft = value as Record<string, unknown>
  if (
    typeof draft.action !== 'string' ||
    !['create', 'append', 'clarify'].includes(draft.action) ||
    typeof draft.category !== 'string' ||
    !['Task', 'Idea', 'Reference', 'Journal', 'Unclear'].includes(draft.category) ||
    typeof draft.path !== 'string' ||
    typeof draft.content !== 'string' ||
    typeof draft.explanation !== 'string' ||
    !draft.explanation.trim() ||
    draft.explanation.length > 2000 ||
    draft.content.length > 20000
  ) {
    throw new Error('Qwen returned an incomplete or invalid draft. Try again.')
  }
  if (draft.action === 'clarify') {
    if (draft.path || draft.content)
      throw new Error('A clarification must not include a note draft.')
  } else {
    validateNotePath(draft.path)
    if (!draft.content.trim() || draft.category === 'Unclear') {
      throw new Error('The draft needs clear note content before it can be sent.')
    }
  }
  return {
    action: draft.action as NoteDraft['action'],
    category: draft.category as NoteDraft['category'],
    path: draft.path,
    content: draft.content,
    explanation: draft.explanation.trim()
  }
}
