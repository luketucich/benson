import { is } from '@electron-toolkit/utils'

// Switches for testing Benson while developing. They do nothing in the real app.
//   BENSON_ONBOARDING=1          shows onboarding even after setup
//   BENSON_PRETEND_MISSING=uv,ffmpeg   makes those pieces look missing, to test downloads
//   BENSON_PRETEND_MIC_DENIED=1  shows onboarding's "turn on your microphone" screen
const env = is.dev ? process.env : {}

export const dev = {
  showOnboarding: env.BENSON_ONBOARDING === '1',
  pretendMissing: (env.BENSON_PRETEND_MISSING ?? '').split(','),
  pretendMicDenied: env.BENSON_PRETEND_MIC_DENIED === '1'
}
