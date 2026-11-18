import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { download } from '../src/main/setup/download.ts'

const body = Buffer.alloc(2000, 7)

const servers: Server[] = []
// Close every server even when a test fails, so the run can finish.
after(() => servers.forEach((server) => server.closeAllConnections() || server.close()))

// A tiny local server, so the tests never touch the internet.
function serve(
  handler: Parameters<typeof createServer>[1]
): Promise<{ url: string; server: Server }> {
  const server = createServer(handler)
  servers.push(server)
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number }
      resolve({ url: `http://127.0.0.1:${port}`, server })
    })
  )
}

function scratch(): string {
  return join(mkdtempSync(join(tmpdir(), 'benson-download-')), 'tool.bin')
}

test('saves the file and reports progress', async () => {
  const { url, server } = await serve((_, response) => {
    response.writeHead(200, { 'Content-Length': body.length })
    response.end(body)
  })
  const destination = scratch()
  const progress: [number, number | null][] = []
  await download(url, destination, (done, total) => progress.push([done, total]))
  server.close()
  assert.deepEqual(readFileSync(destination), body)
  assert.deepEqual(progress.at(-1), [2000, 2000])
  assert.equal(existsSync(destination + '.part'), false)
})

test('leaves nothing behind when the connection drops', async () => {
  const { url, server } = await serve((_, response) => {
    response.writeHead(200, { 'Content-Length': body.length })
    response.write(body.subarray(0, 500), () => response.socket?.destroy())
  })
  const destination = scratch()
  await assert.rejects(
    download(url, destination, () => {}),
    {
      message: 'The download stopped. Check your internet and press Try again.'
    }
  )
  server.close()
  assert.equal(existsSync(destination), false)
  assert.equal(existsSync(destination + '.part'), false)
})

test('follows redirects', async () => {
  const { url, server } = await serve((request, response) => {
    if (request.url === '/') {
      response.writeHead(302, { Location: '/file' })
      response.end()
      return
    }
    response.writeHead(200, { 'Content-Length': body.length })
    response.end(body)
  })
  const destination = scratch()
  await download(url + '/', destination, () => {})
  server.close()
  assert.deepEqual(readFileSync(destination), body)
})
