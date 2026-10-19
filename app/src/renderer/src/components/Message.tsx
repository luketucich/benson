// Small wrappers so screen readers announce updates and problems correctly.
export function Status({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p role="status">{children}</p>
}

export function Alert({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p role="alert">{children}</p>
}
