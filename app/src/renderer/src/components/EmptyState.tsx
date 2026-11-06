// First thing you see: what Benson does, in three steps.
export function EmptyState({ shortcut }: { shortcut: string | null }): React.JSX.Element {
  return (
    <section className="empty" aria-labelledby="empty-heading">
      <h2 id="empty-heading">Say something to Benson</h2>
      <ol className="steps">
        <li>
          <span aria-hidden="true">1</span>Record a thought
        </li>
        <li>
          <span aria-hidden="true">2</span>Check the note Benson writes
        </li>
        <li>
          <span aria-hidden="true">3</span>Save it to Obsidian
        </li>
      </ol>
      <p className="meta">
        {shortcut
          ? `Press Record, or hold ${shortcut} from any app.`
          : 'Press Record, or set a shortcut below to record from any app.'}
      </p>
    </section>
  )
}
