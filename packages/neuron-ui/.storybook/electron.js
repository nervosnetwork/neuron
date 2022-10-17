const sendSyncValues = {}

sendSyncValues['get-locale'] = 'zh'
sendSyncValues['get-version'] = '0.103.1'

module.exports = {
  ipcRenderer: {
    sendSync(key) {
      return sendSyncValues[key]
    },
    invoke() {
      return Promise.resolve({})
    },
    on() {},
    removeAllListeners() {}
  },
  clipboard() {},
  nativeImage() {},
  shell() {},
  desktopCapturer() {}
}