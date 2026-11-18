import { useEffect, useRef } from 'react'
import type { PieceStatus } from '../../../setup'
import { RetryIcon } from '../components/icons'
import { Screen } from './Screen'
import { useSetup } from './useSetup'

// Downloads whatever Benson is missing, then moves on by itself. It only has
// a button when something goes wrong. onSkip is there when fixing a missing
// piece later, so a failed download never locks you out of Benson.
export function GettingReady({
  onNext,
  onSkip
}: {
  onNext: () => void
  onSkip?: () => void
}): React.JSX.Element {
  const { pieces, ready, failed, run } = useSetup()
  // Moves on once, even if the screen redraws before it's gone.
  const movedOn = useRef(false)

  useEffect(() => {
    if (!ready || movedOn.current) return
    movedOn.current = true
    onNext()
  }, [ready, onNext])

  return (
    <Screen
      visual={<Ring fraction={overall(pieces)} failed={Boolean(failed)} />}
      title="Getting Benson ready"
      description={failed ? failed.error : currentStep(pieces)}
    >
      {failed && (
        <button className="button-primary onboarding-main" onClick={run}>
          <RetryIcon />
          Try again
        </button>
      )}
      {failed && onSkip && (
        <button className="button-ghost" onClick={onSkip}>
          Skip for now
        </button>
      )}
    </Screen>
  )
}

// How far along, from 0 to 1. Each piece counts the same.
function overall(pieces: PieceStatus[]): number {
  if (!pieces.length) return 0
  const done = pieces.reduce((sum, piece) => {
    if (piece.state === 'ready') return sum + 1
    if (piece.state === 'installing' && piece.total) return sum + (piece.done ?? 0) / piece.total
    return sum
  }, 0)
  return done / pieces.length
}

// What Benson is doing right now, in plain words.
function currentStep(pieces: PieceStatus[]): string {
  const piece = pieces.find((each) => each.state === 'installing')
  if (!piece) return 'Checking what your Mac already has. This only happens once.'
  const name = piece.name.toLowerCase()
  if (!piece.total) return `Setting up the ${name}...`
  return `Downloading the ${name}: ${size(piece.done ?? 0, piece.total)} of ${size(piece.total, piece.total)}`
}

// Sizes in GB once the download is that big, otherwise MB.
function size(bytes: number, total: number): string {
  return total >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`
}

// A ring that fills as Benson gets ready.
function Ring({ fraction, failed }: { fraction: number; failed: boolean }): React.JSX.Element {
  const circumference = 2 * Math.PI * 42
  return (
    <svg
      className={failed ? 'onboarding-ring ring-failed' : 'onboarding-ring'}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <circle className="ring-track" cx="50" cy="50" r="42" />
      <circle
        className="ring-fill"
        cx="50"
        cy="50"
        r="42"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - fraction)}
      />
      <text x="50" y="50" dominantBaseline="central" textAnchor="middle">
        {Math.floor(fraction * 100)}%
      </text>
    </svg>
  )
}
