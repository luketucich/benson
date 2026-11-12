import { createContext, useContext } from 'react'

// Toasts are the small messages that pop up and fade away: something worked,
// something was undone, or something went wrong.
export type ToastKind = 'success' | 'info' | 'error'

export type ShowToast = (message: string, kind?: ToastKind) => void

export const ToastContext = createContext<ShowToast>(() => {})

// Anything in the main window can show a toast: toast('Note discarded', 'info').
export function useToast(): ShowToast {
  return useContext(ToastContext)
}

// The readable part of an error from main, without Electron's
// "Error invoking remote method ..." in front.
export function errorText(problem: unknown): string {
  return String(problem).split('Error: ').pop() ?? ''
}
