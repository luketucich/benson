import { execFile } from 'child_process'
import { chmodSync, mkdirSync, readdirSync, rmSync, renameSync, symlinkSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { promisify } from 'util'
import { dev } from '../dev'
import {
  isRunning,
  serverVersion,
  ollamaProgram,
  ensureOllamaRunning,
  pullModel,
  runningSomeoneElsesOllama
} from '../ollama'
import { QWEN_MODEL as QWEN } from '../qwen'
import { transcribeScript } from '../recordingFiles'
import { wasStopped, workSignal } from '../work'
import { download } from './download'
import { toolsBin, toolsFolder } from './paths'
import { qwenDownloaded, speechModelReady } from './models'
import { isAtLeast, parseVersion } from './versions'
import type { PieceId } from '../../setup'

const runProgram = promisify(execFile)

// What Benson needs, in the order they're installed: later ones use earlier ones.
export interface Piece {
  id: PieceId
  name: string
  isReady: () => Promise<boolean>
  install: (progress: (done: number, total: number | null) => void) => Promise<void>
}

// The oldest Ollama Benson trusts to run Qwen.
const OLLAMA_MINIMUM = '0.40.0'
// Only one Ollama can run at a time, so Benson can't replace one that's running.
const OLLAMA_OUT_OF_DATE = 'Your Ollama is out of date. Quit Ollama and press Try again.'

// A program's version, or null if it isn't installed.
async function versionOf(program: string, flag: string): Promise<string | null> {
  try {
    const { stdout, stderr } = await runProgram(program, [flag])
    return parseVersion(stdout + stderr)
  } catch {
    return null
  }
}

// Downloads an archive into Benson's tools folder and unpacks it into a fresh folder.
async function downloadAndUnpack(
  url: string,
  name: string,
  progress: (done: number, total: number | null) => void
): Promise<string> {
  const downloads = join(toolsFolder(), 'downloads')
  const archive = join(downloads, name)
  const unpacked = join(downloads, name.split('.')[0])
  mkdirSync(downloads, { recursive: true })
  rmSync(unpacked, { recursive: true, force: true })
  mkdirSync(unpacked)
  await download(url, archive, progress, workSignal())
  // tar handles .tar.gz and .tgz; ditto is the Mac's own unzip.
  if (name.endsWith('.zip')) await runProgram('ditto', ['-x', '-k', archive, unpacked])
  else await runProgram('tar', ['-xzf', archive, '-C', unpacked])
  rmSync(archive, { force: true })
  return unpacked
}

// Finds a program by name anywhere inside an unpacked folder.
function findInside(folder: string, program: string): string {
  const match = readdirSync(folder, { recursive: true, encoding: 'utf8' }).find(
    (path) => path === program || path.endsWith(`/${program}`)
  )
  if (!match) throw new Error(`The download didn’t include ${program}.`)
  return join(folder, match)
}

// Moves a program out of its unpacked download into tools/bin, replacing an
// older copy Benson downloaded, then clears away the rest of the download.
function installProgram(folder: string, name: string): void {
  mkdirSync(toolsBin(), { recursive: true })
  const to = join(toolsBin(), name)
  rmSync(to, { force: true })
  renameSync(findInside(folder, name), to)
  chmodSync(to, 0o755)
  rmSync(folder, { recursive: true, force: true })
}

const uv: Piece = {
  id: 'uv',
  name: 'Python helper',
  isReady: async () => {
    const version = await versionOf('uv', '--version')
    return version !== null && isAtLeast(version, '0.5.0')
  },
  install: async (progress) => {
    const folder = await downloadAndUnpack(
      'https://github.com/astral-sh/uv/releases/latest/download/uv-aarch64-apple-darwin.tar.gz',
      'uv.tar.gz',
      progress
    )
    installProgram(folder, 'uv')
  }
}

const ffmpeg: Piece = {
  id: 'ffmpeg',
  name: 'Audio converter',
  isReady: async () => (await versionOf('ffmpeg', '-version')) !== null,
  install: async (progress) => {
    const folder = await downloadAndUnpack(
      'https://ffmpeg.martin-riedl.de/redirect/latest/macos/arm64/release/ffmpeg.zip',
      'ffmpeg.zip',
      progress
    )
    installProgram(folder, 'ffmpeg')
  }
}

const ollama: Piece = {
  id: 'ollama',
  name: 'Ollama',
  // A running Ollama is used whoever started it. Otherwise the one Benson
  // would start has to be new enough.
  isReady: async () => {
    const running = await serverVersion()
    const version = running ?? (await versionOf(ollamaProgram(), '--version'))
    return version !== null && isAtLeast(version, OLLAMA_MINIMUM)
  },
  install: async (progress) => {
    // Only one Ollama can run at a time, so an old one that's running has to go
    // before Benson can use its own.
    if (await isRunning()) {
      throw new Error(OLLAMA_OUT_OF_DATE)
    }
    const folder = await downloadAndUnpack(
      'https://github.com/ollama/ollama/releases/latest/download/ollama-darwin.tgz',
      'ollama.tgz',
      progress
    )
    // Ollama comes with libraries next to it, so its folder stays whole and
    // tools/bin just points at the program.
    const home = join(toolsFolder(), 'ollama')
    rmSync(home, { recursive: true, force: true })
    renameSync(folder, home)
    const program = findInside(home, 'ollama')
    chmodSync(program, 0o755)
    mkdirSync(toolsBin(), { recursive: true })
    rmSync(join(toolsBin(), 'ollama'), { force: true })
    symlinkSync(program, join(toolsBin(), 'ollama'))
    await ensureOllamaRunning()
  }
}

const qwen: Piece = {
  id: 'qwen',
  name: 'Writing model',
  isReady: async () => qwenDownloaded(join(homedir(), '.ollama/models'), QWEN),
  install: async (progress) => {
    await ensureOllamaRunning()
    try {
      await pullModel(QWEN, progress, workSignal())
    } catch (error) {
      if (wasStopped(error)) throw error
      // Benson only uses someone else's Ollama, so it can't update it.
      if (runningSomeoneElsesOllama()) {
        throw new Error(OLLAMA_OUT_OF_DATE)
      }
      throw new Error('I couldn’t download the writing model. Try again.')
    }
  }
}

const speech: Piece = {
  id: 'speech',
  name: 'Speech model',
  isReady: async () => speechModelReady(join(homedir(), '.cache/huggingface/hub')),
  // uv fetches Python and the speech library, then the script downloads the
  // model. There's no byte count for this part.
  install: async () => {
    try {
      await runProgram('uv', ['run', transcribeScript(), '--prepare'], {
        signal: workSignal(),
        maxBuffer: 32 * 1024 * 1024
      })
    } catch (error) {
      if (wasStopped(error)) throw error
      console.error('Speech setup failed:', (error as { stderr?: string }).stderr ?? error)
      throw new Error('I couldn’t set up speech to text. Try again.')
    }
  }
}

export const pieces: Piece[] = [uv, ffmpeg, ollama, qwen, speech].map((piece) => ({
  ...piece,
  isReady: async () => !dev.pretendMissing.includes(piece.id) && (await piece.isReady())
}))
