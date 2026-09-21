// Send the prompt and transcript to Qwen running locally through Ollama.
export async function askQwen(prompt: string, transcript: string): Promise<string> {
  const response = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(90000),
    body: JSON.stringify({
      model: 'qwen3.5:4b',
      stream: false,
      think: false,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Transcript:\n${transcript}` }
      ]
    })
  })

  if (!response.ok) throw new Error('Ollama could not complete the request.')

  const result = await response.json()
  const text = result.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Qwen returned an empty reply.')
  }
  return text.trim()
}
