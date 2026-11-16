import { ollamaAddress } from './ollama'
import { wasStopped, workSignal } from './work'

// The exact Qwen Benson uses. Plain "qwen3.5:4b" can download Ollama's Apple
// (MLX) version, which can't give the structured replies Benson asks for, so
// Benson asks for this one by name.
export const QWEN_MODEL = 'qwen3.5:4b-q4_K_M'

// Send the prompt and transcript to Qwen running locally through Ollama.
export async function askQwen(
  prompt: string,
  transcript: string,
  format?: object
): Promise<string> {
  let response: Response
  try {
    response = await fetch(`${ollamaAddress}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Gives up after 90 seconds, or when you press Stop.
      signal: AbortSignal.any([workSignal(), AbortSignal.timeout(90000)]),
      body: JSON.stringify({
        model: QWEN_MODEL,
        stream: false,
        think: false,
        format,
        options: { temperature: 0 },
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Transcript:\n${transcript}` }
        ]
      })
    })
  } catch (error) {
    // Stopping on purpose passes straight through.
    if (wasStopped(error)) throw error
    if ((error as Error).name === 'TimeoutError') {
      throw new Error('Benson took too long to answer. Try again.')
    }
    throw new Error('Ollama isn’t running. Open it and try again.')
  }

  if (!response.ok) throw new Error('Ollama couldn’t run Qwen. Make sure it’s installed.')

  const result = await response.json()
  const text = result.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Benson came back empty. Try again.')
  }
  return text.trim()
}
