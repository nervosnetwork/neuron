const sendSyncValues = {
  'get-locale': ('zh', 'fr', 'es', 'ar'),
  'get-version': '0.103.1',
}

export const ipcRenderer = {
  sendSync(key) {
    return sendSyncValues[key]
  },
  invoke() {
    return Promise.resolve({})
  },
  on() {},
  removeAllListeners() {},
}
export const clipboard = () => {}
export const nativeImage = () => {}
export const shell = () => {}
export const desktopCapturer = () => {}
