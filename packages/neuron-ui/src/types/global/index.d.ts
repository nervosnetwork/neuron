import { Clipboard } from 'electron'

declare global {
  interface Window {
    clipboard: Clipboard
  }
}
