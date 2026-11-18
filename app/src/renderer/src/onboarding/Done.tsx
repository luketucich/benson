import { Keys } from '../components/Keys'
import { DoneIcon } from '../components/icons'
import { Screen } from './Screen'

// The end: the two ways to reach Benson from now on.
export function Done({
  shortcut,
  onFinish
}: {
  shortcut: string
  onFinish: () => void
}): React.JSX.Element {
  return (
    <Screen
      visual={<DoneIcon />}
      title="You’re all set"
      description={
        <>
          Hold <Keys label={shortcut} /> in any app to talk to Benson. To see everything you’ve
          said, open Benson from the B in your menu bar.
        </>
      }
    >
      <button className="button-primary onboarding-main" onClick={onFinish}>
        Start using Benson
      </button>
    </Screen>
  )
}
