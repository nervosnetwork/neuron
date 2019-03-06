const electron = require('electron')
const Store = require('../dist/store/WalletStore').default

// Prevent Electron from never exiting when an exception happens
process.on('uncaughtException', error => {
  console.error('Exception:', error)
  process.exit(1)
})

const walletStore = new Store()
walletStore.clear()

walletStore.saveWallet('wallet2', {
  name: 'wallet2',
  keystore: 'qwerty',
})

console.log(walletStore.path())

electron.app.quit()
