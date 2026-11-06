// Small wrappers so screen readers announce updates and problems correctly.
export function Status({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p role="status">{children}</p>
}

export function Alert({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p role="alert">{children}</p>
}

// What Benson is doing right now, with a small spinner.
export function Working({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p role="status" className="working">
      <span className="spinner" aria-hidden="true" />
      {children}
    </p>
  )
}
