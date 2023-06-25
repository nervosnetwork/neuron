const sendSyncValues = {
  'get-locale': 'zh',
  'get-version': '0.103.1'
}

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
