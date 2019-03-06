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

walletStore.saveWallet('wallet2', {
  name: 'wallet2',
  keystore: 'dsf23423',
})

walletStore.saveWallet('wallet3', {
  name: 'wallet3',
  keystore: 'sadqwe',
})

const allWallets = walletStore.getAllWallets()
walletStore.clear()
walletStore.storeAll(allWallets)

console.log(walletStore.path())

electron.app.quit()
