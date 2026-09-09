// This file only tells TypeScript what preload/index.ts adds to window.
// It does not run code. Promise<string> means the text arrives asynchronously.
interface Window {
  api: {
    saveRecording(bytes: ArrayBuffer): Promise<string>
    transcribeRecording(filePath: string): Promise<string>
  }
}
