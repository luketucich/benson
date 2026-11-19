import { useEffect, useRef, useState } from 'react'
import type { NoteDraft } from '../../noteDraft'
import type { PanelAction, PanelStatus } from '../../panel'
import { isWaitingForAnswer, lastSaid, type SavedRecording } from '../../recording'
import { Onboarding } from './onboarding/Onboarding'
import { useOnboarding } from './onboarding/useOnboarding'
import { isPractice } from './onboarding/steps'
import { useHistory } from './hooks/useHistory'
import { usePanel } from './hooks/usePanel'
import { useRecorder } from './hooks/useRecorder'
import { useSettings } from './hooks/useSettings'
import { useShortcut } from './hooks/useShortcut'
import { Working } from './components/Message'
import { Conversation } from './components/Conversation'
import { EmptyState } from './components/EmptyState'
import { HistoryList } from './components/HistoryList'
import { RecordingView } from './components/RecordingView'
import { SidebarFooter } from './components/SidebarFooter'
import { savedText } from './draftText'
import { playSentSound, playStartSound, playStopSound } from './sounds'
import { errorText, useToast } from './toast'

// Anything shorter is usually a slip of the key, so it isn't kept.
const SHORTEST_SECONDS = 1
const NOTHING_HEARD = 'I didn’t hear anything. Try recording again.'

function App(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // What Benson is working on, and whether you can stop it. Null when idle.
  const [work, setWork] = useState<{ text: string; canStop: boolean } | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  // True while recording a spoken reply to Benson, not a new recording.
  const [replying, setReplying] = useState(false)
  // True when this recording's progress and result show in the floating panel.
  const [recordingInPanel, setRecordingInPanel] = useState(false)
  // Changes you made to a recording's note in the panel. If you switch to this
  // window, the note here picks up where you left off.
  const [panelEdit, setPanelEdit] = useState<{ id: number; draft: NoteDraft } | null>(null)
  const wasRecordingRef = useRef(false)
  // Set when you press Stop, so the steps still running know to give up.
  const stoppedRef = useRef(false)

  const toast = useToast()
  const history = useHistory()
  const settings = useSettings()
  const panel = usePanel(handlePanelAction)
  const recorder = useRecorder({
    micId: settings.settings.micId,
    onClip: handleClip,
    onError: handleRecorderError
  })
  const shortcut = useShortcut(handleHold)
  const onboarding = useOnboarding()

  const selected = history.items.find((item) => item.id === selectedId)
  const step = work?.text ?? ''
  const stoppable = work?.canStop ?? false
  const busy = Boolean(step) || recorder.busy
  const shortcutLabel = shortcut.state.label || null

  // When the microphone turns on or off, play a rising or falling sound.
  useEffect(() => {
    if (recorder.recording === wasRecordingRef.current) return
    wasRecordingRef.current = recorder.recording
    if (recorder.recording) playStartSound()
    else playStopSound()
  }, [recorder])

  function clearMessages(): void {
    setJustSaved(false)
    setPanelEdit(null)
  }

  // Something went wrong. Benson says so in a toast here, and in the panel too,
  // in the same words. Stopping on purpose isn't a problem, so it says nothing.
  function fail(text: string): PanelStatus {
    if (stoppedRef.current) return { kind: 'stopped' }
    toast(text, 'error')
    return { kind: 'error', text }
  }

  // Shows what Benson is doing here and, for shortcut recordings, in the panel.
  // Each step starts here, so once you've pressed Stop, the next one doesn't.
  function progress(text: string, inPanel: boolean, canStop = true): void {
    if (stoppedRef.current) throw new Error('Stopped.')
    setWork({ text, canStop })
    if (inPanel) panel.show({ kind: 'working', text, canStop })
  }

  // Stops what Benson is working on. The recording stays, so you can carry on
  // from where it stopped with Continue.
  function stopWork(): void {
    if (!stoppable) return
    stoppedRef.current = true
    window.api.stopWork()
  }

  // Wraps up a step: refresh the list, stop showing progress, and give the
  // panel its result.
  async function finish(result: PanelStatus | null, inPanel: boolean): Promise<void> {
    // Nothing is left to stop, so Stop goes away before anything else.
    setWork(null)
    // If Benson's answer arrived just as you pressed Stop, it's still shown.
    if (stoppedRef.current && result?.kind !== 'review') result = { kind: 'stopped' }
    await history.reload()
    stoppedRef.current = false
    setPanelEdit(null)
    window.api.setRecordingActivity('idle')
    if (inPanel) panel.show(result)
  }

  // Shortcut recordings show in the panel. So does replying from the panel.
  function startRecording(fromShortcut: boolean, reply: boolean, showInPanel = fromShortcut): void {
    clearMessages()
    setReplying(reply)
    setRecordingInPanel(showInPanel)
    // The panel shows up right away, before the microphone is ready, so you
    // know straight off that Benson heard the shortcut.
    if (showInPanel) panel.show({ kind: 'recording', held: fromShortcut })
    void recorder.start(fromShortcut)
  }

  function handleHold(down: boolean): void {
    // During onboarding the shortcut only records on the practice screens.
    if (onboarding.step && !isPractice(onboarding.step)) return
    recorder.setHeld(down)
    if (!down) {
      if (!recorder.startedByShortcut()) return
      // Let go before the microphone was ready: nothing was recorded, so the
      // panel goes away again.
      if (!recorder.recording) panel.show(null)
      recorder.stop()
      return
    }
    // Pressing the shortcut while Benson is working stops it.
    if (stoppable) return stopWork()
    if (busy || recorder.recording || shortcut.changing) return
    // Holding the shortcut answers Benson's question if you can see it, in
    // the panel or in this window. Otherwise it starts a new recording.
    const questionShowing = panel.showingQuestion || document.hasFocus()
    // The main-window practice keeps everything in the window, not the pop-up.
    const showInPanel = onboarding.step !== 'practice-window'
    startRecording(true, isWaitingForAnswer(selected) && questionShowing, showInPanel)
  }

  function toggleRecording(): void {
    if (recorder.recording) return recorder.stop()
    panel.show(null)
    startRecording(false, false)
  }

  function handleRecorderError(message: string): void {
    setReplying(false)
    const result = fail(message)
    if (recordingInPanel) panel.show(result)
  }

  async function handleClip(blob: Blob, seconds: number): Promise<void> {
    // A quick tap is dropped without a word, and the panel goes away.
    if (seconds < SHORTEST_SECONDS) {
      setReplying(false)
      return finish(null, recordingInPanel)
    }
    if (replying && selected) await replyByVoice(selected.id, blob, recordingInPanel)
    else await newRecording(blob, recordingInPanel)
    setReplying(false)
  }

  // Turns a recording into text. False if there were no words in it.
  async function transcribe(id: number, path: string, inPanel: boolean): Promise<boolean> {
    progress('Turning speech into text...', inPanel)
    const text = await window.api.transcribeRecording(path)
    await history.reload()
    if (text.trim()) return true
    // A practice run with no words goes back to its instructions to try again.
    onboarding.discarded(id)
    return false
  }

  // Asks Benson for a note (or a question) and says how it went.
  async function askBenson(id: number, inPanel: boolean): Promise<PanelStatus> {
    progress('Writing your note...', inPanel)
    try {
      const { draft, said } = await window.api.writeNote(id)
      return { kind: 'review', draft, said }
    } catch (problem) {
      return fail(errorText(problem) || 'I couldn’t write a note. Try again.')
    }
  }

  async function newRecording(blob: Blob, inPanel: boolean): Promise<void> {
    let result: PanelStatus | null = null
    try {
      // The new recording isn't in the list yet, so show its progress on its own
      // instead of under whichever recording was open.
      setSelectedId(null)
      progress('Saving your recording...', inPanel)
      const { id, path } = await window.api.saveRecording(await blob.arrayBuffer())
      setSelectedId(id)
      onboarding.recorded(id)
      await history.reload()

      if (!(await transcribe(id, path, inPanel))) {
        result = fail(NOTHING_HEARD)
        return
      }

      result = await askBenson(id, inPanel)
    } catch (problem) {
      console.error(problem)
      result = fail(errorText(problem) || 'I couldn’t save or transcribe that.')
    } finally {
      await finish(result, inPanel)
    }
  }

  // Your reply goes into the thread right away, then Benson tries again with it.
  async function reply(id: number, add: () => Promise<void>, inPanel: boolean): Promise<void> {
    clearMessages()
    let result: PanelStatus | null = null
    try {
      progress('Reading your reply...', inPanel)
      await add()
      await history.reload()
      result = await askBenson(id, inPanel)
    } catch (problem) {
      result = fail(errorText(problem))
    } finally {
      await finish(result, inPanel)
    }
  }

  function replyByText(text: string, inPanel: boolean): void {
    if (selected) void reply(selected.id, () => window.api.addReply(selected.id, text), inPanel)
  }

  async function replyByVoice(id: number, blob: Blob, inPanel: boolean): Promise<void> {
    const bytes = await blob.arrayBuffer()
    await reply(id, () => window.api.addVoiceReply(id, bytes), inPanel)
  }

  // The mic in the reply box: start a spoken reply, or stop it.
  function talk(inPanel: boolean): void {
    if (recorder.recording) recorder.stop()
    else startRecording(false, true, inPanel)
  }

  async function save(draft: NoteDraft, inPanel: boolean): Promise<void> {
    if (!selected) return
    clearMessages()
    let result: PanelStatus | null = null
    try {
      // Saving is quick, and stopping halfway could leave half a note.
      progress('Saving to Obsidian...', inPanel, false)
      const saved = await window.api.saveNote(selected.id, draft)
      playSentSound()
      setJustSaved(true)
      toast(savedText(saved))
      onboarding.saved(selected.id)
      result = { kind: 'sent', draft: saved }
    } catch (problem) {
      result = fail(`I couldn’t save it. ${errorText(problem)}`)
    } finally {
      await finish(result, inPanel)
    }
  }

  async function discard(inPanel: boolean): Promise<void> {
    if (!selected) return
    clearMessages()
    try {
      await window.api.discardNote(selected.id)
      toast('Note discarded', 'info')
      onboarding.discarded(selected.id)
      await finish(null, inPanel)
    } catch (problem) {
      await finish(fail(`I couldn’t discard it. ${errorText(problem)}`), inPanel)
    }
  }

  // Buttons pressed in the floating panel. They do what the same buttons do here.
  function handlePanelAction(action: PanelAction): void {
    if (action.type === 'stop-recording') {
      // Stopped before the microphone was ready: nothing was recorded.
      if (!recorder.recording) panel.show(null)
      return recorder.stop()
    }
    if (action.type === 'stop-work') return stopWork()
    if (action.type === 'edit') {
      if (selected) setPanelEdit({ id: selected.id, draft: action.draft })
      return
    }
    // A second press while Benson is still working is ignored, like a disabled button.
    if (busy) return
    if (action.type === 'save') void save(action.draft, true)
    if (action.type === 'discard') void discard(true)
    if (action.type === 'reply') replyByText(action.text, true)
    if (action.type === 'talk') talk(true)
    if (action.type === 'continue') void retry(true)
  }

  // When Benson didn't get to answer (it failed, you stopped it, or
  // transcription didn't finish), carry on from that step.
  async function retry(inPanel: boolean): Promise<void> {
    if (!selected) return
    clearMessages()
    const { id, audio_path, transcript, conversation } = selected
    // Benson already answered (it finished just as you pressed Stop, or your
    // spoken reply was stopped): show that answer instead of asking again.
    const last = conversation.at(-1)
    if (last?.role === 'benson' && !last.outcome) {
      if (inPanel) panel.show({ kind: 'review', draft: last.draft, said: lastSaid(selected) })
      return
    }
    let result: PanelStatus | null = null
    try {
      if (!transcript?.trim() && !(await transcribe(id, audio_path, inPanel))) {
        result = fail(NOTHING_HEARD)
        return
      }
      result = await askBenson(id, inPanel)
    } catch (problem) {
      result = fail(errorText(problem))
    } finally {
      await finish(result, inPanel)
    }
  }

  function openRecording(recording: SavedRecording): void {
    panel.show(null)
    clearMessages()
    setSelectedId(recording.id)
  }

  async function deleteRecording(recording: SavedRecording): Promise<void> {
    try {
      await window.api.deleteRecording(recording.id)
    } catch {
      toast('I couldn’t delete that recording. Try again.', 'error')
      return
    }
    toast('Recording deleted', 'info')
    if (recording.id === selectedId) {
      clearMessages()
      setSelectedId(null)
    }
    await history.reload()
  }

  // The open recording as a thread. Onboarding shows it too, for the practice
  // note in the main-window practice.
  const thread = selected ? (
    <Conversation
      key={selected.id}
      recording={selected}
      step={step}
      busy={busy}
      listening={recorder.recording && replying}
      justSaved={justSaved}
      panelEdit={panelEdit?.id === selected.id ? panelEdit.draft : null}
      onSave={(draft) => void save(draft, false)}
      onDiscard={() => void discard(false)}
      onReply={(text) => replyByText(text, false)}
      onRetry={() => void retry(false)}
      onStop={stoppable ? stopWork : null}
      onTalk={() => talk(false)}
    />
  ) : null

  // Onboarding takes the whole window until it's finished.
  if (onboarding.step) {
    return (
      <Onboarding
        step={onboarding.step}
        repair={onboarding.repair}
        thread={onboarding.practicing !== null ? thread : null}
        settings={settings}
        shortcut={shortcut}
        onNext={onboarding.next}
        onFinish={() => void onboarding.finish()}
      />
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-top">
          <p className="wordmark">Benson</p>
          <button
            className="record-button"
            aria-pressed={recorder.recording}
            disabled={busy || shortcut.changing}
            onClick={toggleRecording}
          >
            <span className="record-dot" aria-hidden="true" />
            {recorder.recording ? 'Stop' : 'Record'}
          </button>
        </div>

        <HistoryList
          items={history.items}
          loading={history.loading}
          error={history.error}
          disabled={busy || recorder.recording}
          selectedId={selectedId}
          onOpen={openRecording}
          onDelete={deleteRecording}
          onRetry={history.reload}
        />

        <SidebarFooter
          shortcut={shortcut.state}
          shortcutButton={shortcut.buttonText}
          busy={busy || recorder.recording}
          settings={settings}
          onChangeShortcut={shortcut.change}
        />
      </aside>

      <main className="content">
        {/* A spoken reply stays in the thread; only a new recording takes over the screen. */}
        {recorder.recording && !replying ? (
          <RecordingView fromShortcut={recorder.startedByShortcut()} />
        ) : selected ? (
          thread
        ) : step ? (
          <Working>{step}</Working>
        ) : (
          <EmptyState shortcut={shortcutLabel} />
        )}
      </main>
    </div>
  )
}

export default App
