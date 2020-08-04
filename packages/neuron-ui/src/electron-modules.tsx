/* eslint-disable import/prefer-default-export */
if (window.electron === undefined) {
  // for developers who develope rendered process in a browser.
  window.electron = Object.create(null)
}
export const { ipcRenderer } = window.electron
export const { clipboard } = window.electron
export const { nativeImage } = window.electron
export const { shell } = window.electron
export const { remote } = window.electron
export const { desktopCapturer } = window.electron
