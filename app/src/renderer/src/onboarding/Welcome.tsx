import benson from '../assets/benson.webp'
import { Screen } from './Screen'

// Benson introduces himself.
export function Welcome({ onNext }: { onNext: () => void }): React.JSX.Element {
  return (
    <Screen
      visual={<img className="onboarding-benson" src={benson} alt="" />}
      title="Meet Benson"
      description="He’s on a break from managing the park, so now he’s managing your thoughts. He might look grumpy. He isn’t. He just really likes things organized."
    >
      <button className="button-primary onboarding-main" onClick={onNext}>
        Hi, Benson
      </button>
    </Screen>
  )
}
