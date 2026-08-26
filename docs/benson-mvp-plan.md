# Benson MVP Plan

## Product Idea

Benson is a cross-platform, local-first agent for Mac and Windows that is there for you any time you have a small thought you do not want to forget. You want to write it down, but you do not want to exit your deep focus or workflow.

Simply hold down a hotkey and say a note you want stored, whether it is for groceries, a reminder, or an idea you were brainstorming. Benson will capture your thought, understand it, let you review it, and send it into Obsidian by either finding the best matching note to place it in or creating a new note.

## Locked MVP

The MVP is to capture your thought, understand it, let you review it, and send it to the correct destination in a polished manner. If Benson is unsure or fails for some reason, the raw recording will be saved in the Benson Inbox. On Mac, Benson will be available from the menu bar at the top of the screen. On Windows, it will use the system tray at the bottom of the screen to open a simple application.

The locked MVP is a small Electron desktop window with push-to-talk or typed input. The user can open Benson from the menu bar or system tray and press **Start a New Thought**, or use a configurable global hotkey. I want to perfect Benson on Mac first because it may be hard to make it fully cross-platform and polished on every device. I will still try to keep it running on Mac and Windows throughout the semester.

- Local English transcription with NVIDIA Parakeet TDT 0.6B v2.
- FluidAudio and Apple's Core ML framework to run Parakeet locally on Mac.
- Local interpretation with Qwen3.5 4B, running through llama.cpp.
- A preview showing the transcript, intended action, title, content, and destination, with explicit confirmation before every change.
- A Benson-owned Obsidian MCP server with only three tools: Find Note, Create Note, and Append to Note.
- A receipt for every attempted action and a local Inbox fallback for uncertainty, offline use, timeouts, or connector failure.
- A simple application with Inbox, History, Connectors, Models, and Settings. A Stats section could be added later.

The Inbox and History will use the same underlying capture records. The Inbox only shows captures that still need attention. History shows every capture, including the audio, transcription, proposed or completed action, destination, and status. A receipt is attached to an attempted action inside History instead of being its own page.

## Not Included in the First Release

- Continuous listening for meetings
- Note deletion, renaming, or moving
- Calendar, task, email, or Apple application connectors
- Arbitrary community MCP servers
- Shell commands or arbitrary file access
- Autonomous multi-step agents
- Automatic context-aware transcript cleanup

These features would add privacy, security, authentication, and edge-case work without making the first demonstration stronger or more fully owned by me.

## Locked Technical Stack

- **Desktop application:** Electron, React, and TypeScript. This seems like the fastest route to a polished Mac prototype. TypeScript can share the same structures between the interface, model layer, and MCP client.
- **First platform:** Mac. I will keep Windows in mind throughout the semester, but I want to perfect Benson on Mac first.
- **Speech model:** NVIDIA Parakeet TDT 0.6B v2. It turns the recording into text. The MVP will be English-first, with Parakeet v3 left open as a multilingual option later.
- **Speech runtime on Mac:** FluidAudio and Core ML. FluidAudio provides a local Core ML path for Parakeet on Apple devices.
- **Local interpretation model:** Qwen3.5 4B. It reads the transcript, understands what I meant, and prepares an action for Benson to suggest.
- **Local model runtime:** llama.cpp. llama.cpp runs the language model locally; it is not the model itself.
- **Connector:** A Benson-owned Obsidian MCP server with Find Note, Create Note, and Append to Note as its only tools.

The cross-platform speech setup is still open for research. FluidAudio and Core ML make sense for Mac, but I can research an easier shared Mac and Windows path after the Mac version works well.

---

## Research and Model Comparisons

The following is research I completed with GPT-5.6 SOL at extra-high effort. I explained the premise of the project and asked it to compare different speech-to-text models and local intelligence models. These are the main trade-offs and why I am going with my current choices.

### Speech-to-Text Research

The speech-to-text decision mainly comes down to English accuracy, local Mac support, and how difficult the model will be to put inside Benson. A lower word error rate means fewer transcription mistakes, but one benchmark does not prove that a model will work best for my voice and normal use.

| Model | Main trade-offs | Decision |
| --- | --- | --- |
| NVIDIA Parakeet TDT 0.6B v2 | English-only batch transcription. Batch means Benson waits until I finish speaking and then processes the whole clip. FluidAudio reported a 2.1% average word error rate on all 2,620 LibriSpeech test-clean files and provides a Core ML version. I still need to test my voice, names, note titles, and background noise. | MVP choice |
| NVIDIA Parakeet Unified 0.6B | Supports batch and streaming. Streaming processes audio while I am speaking and can show an unfinished, changing transcript. FluidAudio reported 2.15% batch and 2.21% streaming average word error rates, but this was tested on different Mac hardware from its v2 result. | First test if live words become important |
| Qwen3-ASR 0.6B | Supports many languages and has strong broader results. It does not currently have the same straightforward FluidAudio and Core ML path as Parakeet for this Mac-first stack. | Worth testing, but not the simplest MVP path |
| NVIDIA Parakeet TDT 0.6B v3 | Supports 25 European languages and has a Core ML version. FluidAudio currently recommends v2 when only English is needed because v2 is slightly more accurate in its matched test. | Future multilingual option |
| Whisper large-v3-turbo | Mature multilingual ecosystem and more cross-platform options. It adds more than I need for an English-first Mac MVP. | Cross-platform fallback |

Overall, I am going with Parakeet v2 because the first release is English-first and it has a straightforward local Mac path through FluidAudio and Core ML. I am not treating it as the winner of every speech benchmark. Before fully committing to it, I need to test it with my own microphone, voice, technical vocabulary, and normal background noise.

### Possible Future Transcript Cleanup

Down the line, I could add a small context-aware cleanup step after Parakeet transcribes the recording. It would look at the surrounding words and suggest the spelling that makes sense. For example, if I mention GitHub or a code repository, Benson should understand that I probably mean **git**, spelled G-I-T. In a normal sentence such as “get the file,” it should use **get**, spelled G-E-T.

The raw transcript would still be saved, and any suggested correction would appear in the review screen. Because this layer could incorrectly change something that was already right, it is a future experiment rather than part of the locked MVP.

### Local Intelligence Research

Transcription gives Benson the words, but it does not understand what I meant. The local intelligence model has to interpret the transcript and prepare one approved action for review. I am not trying to build a fully autonomous agent.

| Model | Advantages and trade-offs | Decision |
| --- | --- | --- |
| Qwen3.5 4B | Apache 2.0, small enough to be a practical starting point, and designed with tool-calling capability. It is recent, so I still need to test a current llama.cpp build and the exact quantized model on my Mac. | Current MVP choice |
| Ministral 3 8B Instruct | Apache 2.0, designed for edge use, and supports function calling and JSON output. It is larger than Qwen3.5 4B and will probably require more memory and time. | Main quality comparison |
| FunctionGemma 270M | Extremely small and focused on function calling. Google describes it as a foundation for a specialized model that performs best after fine-tuning, which would add training work to the MVP. | Possible future experiment |

Overall, Qwen3.5 4B is my current choice because it looks like the best balance between local size and capability. llama.cpp would run it locally. The model would only propose an action. Normal TypeScript code would still validate the required fields, allowed actions, destination, and confirmation before anything changes. I will compare Qwen and Ministral on the same Benson prompts before treating the model choice as final.

### Model Acceptance Gate

The two core priorities will be quality and latency.

- **Quality:** Benson should understand the thought, choose the best Obsidian destination, preserve what I meant, and prepare concise, well-structured Markdown without inventing details.
- **Latency:** The complete process from releasing the hotkey to seeing the review screen should take only a few seconds on my Mac. This includes transcription, interpretation, finding a destination, and formatting the note.

A model does not pass if it is accurate but too slow, or fast but regularly categorizes notes incorrectly. The best choice is the one that meets both priorities inside the actual Benson workflow.

---

## Connector and Safety Plan

### MCP-First, but Not MCP-Only

Benson will be MCP-first, but it will not be limited to MCP. MCP is useful because it gives tools a standard structure, but it is not a trust guarantee. Only reviewed and allowed connectors will be available to Benson.

Benson owns the capture, transcription, local model, confirmation rules, retries, receipts, and Inbox fallback. A connector owns its authentication and the final service-specific action. The model does not directly receive unrestricted access to a connector. It can only propose an allowed action and destination. Normal application code validates the proposal, shows the preview, and performs the action after confirmation.

For the MVP, I will own the Obsidian MCP server. If an official platform integration is simpler and safer than MCP later, Benson can use that integration directly instead of forcing everything through MCP.

### Proposed CaptureDraft

This is an idea I had for how Benson could structure a proposed action. It is only pseudocode, but it gets across the concept. The local model would have to return something like this before Benson could show a preview or make a change:

```text
CaptureDraft {
    originalTranscript: "Remember to buy milk after class"
    proposedAction: "append_to_note"
    title: "Grocery List"
    content: "- Buy milk after class"
    destination: "Grocery List.md"
    needsClarification: false
    clarificationQuestion: none
}
```

The CaptureDraft is not another model. It is Benson's structured version of what it thinks the user wants to do. TypeScript code will check it. If it is valid, Benson shows the preview. If an important field is missing, Benson asks one clarification question or sends the capture to the Inbox.

### Application Organization

- **New Thought:** Starts a voice or typed capture.
- **Inbox:** Shows only captures that still need attention, such as uncertainty, a timeout, offline use, or connector failure.
- **History:** Shows every capture with the audio, transcription, action, destination, and status. A failed row can be opened and retried.
- **Receipt:** Not a separate page. Each attempted action adds a receipt inside its History record showing what was attempted, when it happened, and whether it succeeded.
- **Connectors:** Shows Obsidian and its connection status for the MVP.
- **Models:** Shows the installed transcription and interpretation models.
- **Settings:** Includes the hotkey, microphone, Obsidian vault, confirmation, and privacy settings.

Stats could be added later, but it does not need to be part of the first release.

### Possible Integrations After the MVP

| Integration | Possible approach | Current decision |
| --- | --- | --- |
| Apple Reminders | Apple's EventKit framework provides permission-based access to create and edit reminders. | Best native Apple experiment after the MVP |
| Apple Notes | I could not find a simple public Apple Notes API comparable to EventKit. A community MCP, AppleScript, or Shortcuts approach would add its own permission and reliability work. | Research item to discuss with my professor |
| Google Calendar | The official API can create events and attendees. A user-supplied event ID can also help prevent duplicate events after an unclear failure. | Strong cross-platform option |
| Google Tasks | The official API manages task lists and tasks. | Could be paired with Google Calendar |
| Gmail | Benson could prepare a draft later, but it should not silently send email. | Later idea, not an early connector |

### Safety and Failure Rules

- Every change has a visible preview and explicit confirmation.
- The model can select only allowed actions and destinations.
- The model cannot install tools, control the computer, run shell commands, or access arbitrary files.
- The MVP exposes no delete, rename, or move action.
- A missing critical field causes one clarification question, never a silent guess.
- The proposed clarification timeout is about 15 seconds. If the user does not answer, the capture returns to the Inbox.
- A retry is visible and recorded. Benson must check for an earlier successful write before retrying so it does not create a duplicate.
- If any layer fails, the same audio and transcript remain recoverable from the local Inbox.

### What a Successful Demonstration Looks Like

The user presses the configurable hotkey or types a note. Benson shows the exact transcript and proposed Obsidian action. The user can correct the transcript or draft, confirm it, and verify the result in Obsidian. Back in Benson, History shows the audio, transcript, action, status, and receipt. If any step fails, the same capture appears in the Inbox with the reason and a safe retry option.

My acceptance targets are:

- Every model response either passes the CaptureDraft structure or is safely rejected.
- Zero unintended writes and zero unconfirmed writes during testing.
- No duplicate Obsidian changes after retries.
- The review screen appears within a few seconds on my target Mac for normal short captures.
- Every failed or uncertain capture remains recoverable from the local Inbox.

## Sources

- **Speech research:** [FluidAudio benchmarks](https://github.com/FluidInference/FluidAudio/blob/main/Documentation/Benchmarks.md), [FluidAudio model guide](https://github.com/FluidInference/FluidAudio/blob/main/Documentation/Models.md), [Parakeet v2](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2), [Parakeet v3](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3), [Parakeet Unified](https://huggingface.co/nvidia/parakeet-unified-en-0.6b), [Qwen3-ASR](https://github.com/QwenLM/Qwen3-ASR), and [Whisper large-v3-turbo](https://huggingface.co/openai/whisper-large-v3-turbo).
- **Local intelligence:** [Qwen3.5 4B](https://huggingface.co/Qwen/Qwen3.5-4B), [Ministral 3 8B Instruct](https://huggingface.co/mistralai/Ministral-3-8B-Instruct-2512), [FunctionGemma](https://ai.google.dev/gemma/docs/functiongemma/model_card), and [llama.cpp](https://github.com/ggml-org/llama.cpp).
- **Connector safety:** [MCP tool specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools).
- **Future integrations:** [Apple EventKit](https://developer.apple.com/documentation/eventkit), [Google Calendar event guide](https://developers.google.com/workspace/calendar/api/guides/create-events), [Google Tasks API](https://developers.google.com/workspace/tasks/reference/rest), and [Gmail draft guide](https://developers.google.com/workspace/gmail/api/guides/drafts).
