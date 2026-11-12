import { BrowserWindow, Menu, type WebContents } from 'electron'

// Shows a small native menu where the mouse is, and answers with the value of
// the item you picked, or null if you closed it.
export function askMenu<T>(
  sender: WebContents,
  items: { label: string; value: T }[]
): Promise<T | null> {
  return new Promise((resolve) => {
    const menu = Menu.buildFromTemplate(
      items.map(({ label, value }) => ({ label, click: () => resolve(value) }))
    )
    // Electron runs this after any click, so it only answers when nothing was picked.
    menu.popup({
      window: BrowserWindow.fromWebContents(sender) ?? undefined,
      callback: () => resolve(null)
    })
  })
}
