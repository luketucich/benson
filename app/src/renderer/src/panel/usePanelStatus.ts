import { useEffect, useRef, useState } from 'react'
import type { PanelStatus } from '../../../panel'

// What the panel shows, from the main window. When it's told to hide, the
// last thing shown stays put (with leaving set) so the card can fade out.
// "round" goes up each time the panel reappears, so the card animates in again.
export function usePanelStatus(): {
  status: PanelStatus | null
  leaving: boolean
  round: number
} {
  const [status, setStatus] = useState<PanelStatus | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [round, setRound] = useState(0)
  const hidden = useRef(true)

  useEffect(() => {
    function show(next: PanelStatus | null): void {
      if (next && hidden.current) setRound((count) => count + 1)
      hidden.current = !next
      setLeaving(!next)
      if (next) setStatus(next)
    }
    void window.api.getPanelStatus().then(show)
    return window.api.onPanelStatus(show)
  }, [])

  return { status, leaving, round }
}
