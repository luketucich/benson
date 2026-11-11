interface Props {
  // The field: a text box, or a FieldValue showing something you can't type in.
  children: React.ReactNode
  button: string
  // Shown before the button's words.
  icon: () => React.JSX.Element
  disabled?: boolean
  onClick: () => void
}

// A field with a button beside it, like Save to with Choose File..., or the
// vault with Choose.... Every one in the app looks and works the same.
export function FieldRow({
  children,
  button,
  icon: Icon,
  disabled,
  onClick
}: Props): React.JSX.Element {
  return (
    <div className="field-row">
      {children}
      <button type="button" disabled={disabled} onClick={onClick}>
        <Icon />
        {button}
      </button>
    </div>
  )
}

// Something shown in a field's box that isn't typed, like the vault's name.
export function FieldValue({
  children,
  title
}: {
  children: React.ReactNode
  title?: string
}): React.JSX.Element {
  return (
    <span className="field" title={title}>
      {children}
    </span>
  )
}
