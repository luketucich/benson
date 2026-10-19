import { useCallback, useEffect, useState } from 'react'
import type { SavedRecording } from '../../../recording'

// Loads the list of saved recordings and keeps it fresh.
export function useHistory(): {
  items: SavedRecording[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const [items, setItems] = useState<SavedRecording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(
    () =>
      window.api
        .getRecordings()
        .then((saved) => {
          setItems(saved)
          setError(null)
        })
        .catch(() => setError('Could not load your recordings. Try again.'))
        .finally(() => setLoading(false)),
    []
  )

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, loading, error, reload }
}
