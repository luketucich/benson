// Confirms a note reached Obsidian. The check draws itself when it was just sent.
export function SentNote({
  path,
  sentAt
}: {
  path: string | null
  sentAt: string
}): React.JSX.Element {
  const when = new Date(sentAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  return (
    <div className={path ? 'sent just-sent' : 'sent'} role="status">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" />
        <path d="M7 12.5l3.2 3.2L17 9" />
      </svg>
      <div>
        <p>Saved to Obsidian</p>
        <p className="meta">{path ?? when}</p>
      </div>
    </div>
  )
}
