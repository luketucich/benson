import {
  ArrowUp,
  ArrowUpRight,
  Check,
  CircleAlert,
  CircleCheck,
  Ellipsis,
  FolderOpen,
  Info,
  Keyboard,
  Mic,
  Pause,
  Play,
  RotateCw,
  Settings,
  Square,
  Trash2,
  Volume2,
  X,
  type LucideIcon
} from 'lucide-react'

// Benson's icons come from Lucide (lucide.dev). They're all set up here, so
// every icon in the app has the same size and line weight.

function icon(Shape: LucideIcon, filled = false): () => React.JSX.Element {
  return function Icon() {
    return (
      <Shape
        className="icon"
        size={16}
        strokeWidth={1.75}
        fill={filled ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
    )
  }
}

export const PlayIcon = icon(Play, true)
export const PauseIcon = icon(Pause, true)
export const MicIcon = icon(Mic)
export const MoreIcon = icon(Ellipsis)
export const GearIcon = icon(Settings)
export const CloseIcon = icon(X)
export const CheckIcon = icon(Check)
export const SendIcon = icon(ArrowUp)
export const StopIcon = icon(Square, true)
export const AlertIcon = icon(CircleAlert)
export const InfoIcon = icon(Info)
export const FolderIcon = icon(FolderOpen)
export const KeyboardIcon = icon(Keyboard)
export const TrashIcon = icon(Trash2)
export const OpenIcon = icon(ArrowUpRight)
export const RetryIcon = icon(RotateCw)
export const SpeakerIcon = icon(Volume2)
export const DoneIcon = icon(CircleCheck)
