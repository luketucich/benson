import { useEffect, useState } from 'react'
import type { PieceStatus } from '../../../setup'

// What Benson needs and how each piece is doing. Opening the screen checks
// everything and installs what's missing; run() tries again after a failure.
export function useSetup(): {
  pieces: PieceStatus[]
  ready: boolean
  failed: PieceStatus | undefined
  run: () => void
} {
  const [pieces, setPieces] = useState<PieceStatus[]>([])
  const run = (): void => void window.api.runSetup()

  useEffect(() => {
    const stopListening = window.api.onSetupProgress(setPieces)
    void window.api.runSetup()
    return stopListening
  }, [])

  return {
    pieces,
    ready: pieces.length > 0 && pieces.every((piece) => piece.state === 'ready'),
    failed: pieces.find((piece) => piece.state === 'failed'),
    run
  }
}
