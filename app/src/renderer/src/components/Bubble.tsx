// One message in the thread. Yours sit on the right, Benson's on the left,
// like a text conversation.
// Only new messages ease in. Ones already there when you open a thread
// (still) just appear, so switching threads doesn't flash.
export function Bubble({
  from,
  className = '',
  still = false,
  children
}: {
  from: 'you' | 'benson'
  className?: string
  still?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={`bubble bubble-${from} ${still ? 'bubble-still' : ''} ${className}`}>
      {children}
    </div>
  )
}
