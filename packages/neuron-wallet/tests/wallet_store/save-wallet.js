const electron = require('electron')
const Store = require('../../dist/store/WalletStore').default

// Prevent Electron from never exiting when an exception happens
process.on('uncaughtException', error => {
  console.error('Exception:', error)
  process.exit(1)
})

const walletStore = new Store()
walletStore.clear()

walletStore.saveWallet('wallet1', {
  name: 'wallet1',
  keystore: 'qazwsx',
})

console.log(JSON.stringify(walletStore.getStore()))

electron.app.quit()
