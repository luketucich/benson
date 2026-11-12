import { useCallback, useState } from 'react'
import { ToastContext, type ToastKind } from '../toast'
import { AlertIcon, CheckIcon, InfoIcon } from './icons'

interface Toast {
  id: number
  kind: ToastKind
  message: string
  leaving: boolean
}

// Errors stay a little longer, so there's time to read them.
const SHOW_MS = { success: 3000, info: 3000, error: 5000 }
// How long a toast takes to fade out (toast-out in motion.css).
const FADE_MS = 200
// Only the newest few stay on screen.
const MOST = 3

let nextId = 0

const icons = { success: CheckIcon, info: InfoIcon, error: AlertIcon }

// Shows toasts at the top of the window. Wrap the app in this, then call
// useToast() anywhere inside it.
export function ToastProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Fades a toast out, then takes it away.
  const dismiss = useCallback((id: number) => {
    setToasts((list) =>
      list.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast))
    )
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), FADE_MS)
  }, [])

  const show = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = nextId++
      setToasts((list) => [...list.slice(1 - MOST), { id, kind, message, leaving: false }])
      setTimeout(() => dismiss(id), SHOW_MS[kind])
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map(({ id, kind, message, leaving }) => {
          const Icon = icons[kind]
          return (
            <button
              key={id}
              className={`toast toast-${kind}${leaving ? ' toast-leave' : ''}`}
              role={kind === 'error' ? 'alert' : 'status'}
              title="Dismiss"
              onClick={() => dismiss(id)}
            >
              <Icon />
              {message}
            </button>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
