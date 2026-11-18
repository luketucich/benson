import { createWriteStream } from 'node:fs'
import { rename, rm } from 'node:fs/promises'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream } from 'node:stream/web'

// Downloads a file without ever leaving half of one behind. It's written to
// "<destination>.part" first and only renamed once every byte arrived, so a
// dropped connection or a quit never looks like a finished tool.
export async function download(
  url: string,
  destination: string,
  onProgress: (done: number, total: number | null) => void,
  signal?: AbortSignal
): Promise<void> {
  const partial = destination + '.part'
  try {
    // fetch follows redirects, which GitHub's "latest" links use.
    const response = await fetch(url, { signal })
    if (!response.ok || !response.body) throw new Error(`Download failed (${response.status}).`)
    const total = Number(response.headers.get('content-length')) || null

    let done = 0
    const counter = new Transform({
      transform(chunk: Buffer, _, next) {
        done += chunk.length
        onProgress(done, total)
        next(null, chunk)
      }
    })
    await pipeline(
      Readable.fromWeb(response.body as ReadableStream),
      counter,
      createWriteStream(partial),
      { signal }
    )
    if (total !== null && done < total) throw new Error('The download stopped partway.')

    await rename(partial, destination)
  } catch (error) {
    await rm(partial, { force: true })
    // Stopping on purpose passes straight through; anything else is put plainly.
    if ((error as Error).name === 'AbortError') throw error
    throw new Error('The download stopped. Check your internet and press Try again.')
  }
}
