import { useEffect, useState } from 'react'
import type { PanelAction, PanelStatus } from '../../../panel'
import { useEventCallback } from './useEventCallback'

// The floating panel, from the main window's side: a way to show something
// in it, whether it's showing Benson's question, and its buttons coming back.
export function usePanel(onAction: (action: PanelAction) => void): {
  show: (status: PanelStatus | null) => void
  showingQuestion: boolean
} {
  const [status, setStatus] = useState<PanelStatus | null>(null)
  const handleAction = useEventCallback(onAction)

  useEffect(() => window.api.onPanelStatus(setStatus), [])
  useEffect(() => window.api.onPanelAction(handleAction), [handleAction])

  return {
    show: window.api.setPanelStatus,
    showingQuestion: status?.kind === 'review' && status.draft.action === 'clarify'
  }
}
