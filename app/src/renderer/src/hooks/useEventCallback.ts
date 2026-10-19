import { useCallback, useEffect, useRef } from 'react'

// Listeners are set up once, but they should still call the newest version of a
// callback. This keeps the newest one in a ref and hands back a stable function.
export function useEventCallback<A extends unknown[]>(
  callback: (...args: A) => void
): (...args: A) => void {
  const latest = useRef(callback)

  useEffect(() => {
    latest.current = callback
  })

  return useCallback((...args: A) => latest.current(...args), [])
}
