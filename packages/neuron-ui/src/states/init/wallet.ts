import { addresses, currentWallet } from 'services/localCache'

export const emptyWallet: State.Wallet = {
  name: '',
  id: '',
  balance: '0',
  addresses: [],
}

const wallet = currentWallet.load()

export const walletState: State.Wallet = {
  name: wallet.name || '',
  id: wallet.id || '',
  balance: '0',
  addresses: addresses.load(),
}

export default walletState
