// Every onboarding screen has the same four parts, top to bottom: a visual,
// a title, a short description, and its button (children).
export function Screen({
  visual,
  title,
  description,
  children
}: {
  visual: React.ReactNode
  title: string
  description: React.ReactNode
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="onboarding-screen" aria-label={title}>
      <div className="onboarding-visual">{visual}</div>
      <h1>{title}</h1>
      <p className="onboarding-description">{description}</p>
      {children}
    </section>
  )
}
