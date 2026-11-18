import { Keys } from '../components/Keys'
import { Screen } from './Screen'

// What each practice run asks you to say, and what to do once Benson answers.
// Each one only moves on once you've saved the note.
const practice = {
  panel: {
    title: 'Try the pop-up',
    say: 'Remind me to call Mom tomorrow.',
    where: 'A pop-up shows up over whatever you’re doing, so you never have to switch apps.',
    then: 'Now save it in the pop-up.'
  },
  window: {
    title: 'Try the main window',
    say: 'Add eggs to my list.',
    where: 'This time it shows up here, in Benson’s window, where all your notes live.',
    then: 'Answer Benson if he asks, then save it.'
  }
}

export function PracticeStep({
  kind,
  shortcut,
  thread,
  onSkip
}: {
  kind: keyof typeof practice
  shortcut: string
  // The practice note's thread, once you've recorded it.
  thread: React.ReactNode
  onSkip: () => void
}): React.JSX.Element {
  const { title, say, where, then } = practice[kind]
  // The main-window practice shows the note in a small copy of the window.
  const showThread = kind === 'window' && thread

  return (
    <Screen
      visual={
        showThread ? (
          <div className="onboarding-window">
            <div className="content">{thread}</div>
          </div>
        ) : (
          <div className="onboarding-waiting" aria-hidden="true" />
        )
      }
      title={title}
      description={
        thread ? (
          then
        ) : (
          <>
            Hold <Keys label={shortcut} /> and say <q>{say}</q> {where}
          </>
        )
      }
    >
      <button className="button-ghost" onClick={onSkip}>
        Skip
      </button>
    </Screen>
  )
}
