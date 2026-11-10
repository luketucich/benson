// Mac symbols for the modifier keys, in the order macOS shows them.
const symbols: Record<string, string> = {
  Control: '⌃',
  Option: '⌥',
  Shift: '⇧',
  Command: '⌘'
}

// Shows a shortcut like "Control + Option + Space" as small key caps.
export function Keys({ label }: { label: string }): React.JSX.Element {
  const keys = label.split(' + ')
  return (
    <span className="keys" aria-label={label}>
      {keys.map((key) => (
        <kbd key={key} aria-hidden="true" title={symbols[key] ? key : undefined}>
          {symbols[key] ?? key}
        </kbd>
      ))}
    </span>
  )
}
