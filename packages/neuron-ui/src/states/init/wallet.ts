import { addresses, currentWallet } from 'services/localCache'

export const emptyWallet: State.Wallet = {
  name: '',
  id: '',
  balance: '0',
  addresses: [],
  extendedKey: '',
}

const wallet = currentWallet.load()

export const walletState: State.Wallet = {
  name: wallet?.name || '',
  id: wallet?.id || '',
  balance: '0',
  addresses: addresses.load(),
  device: wallet?.device,
  isHD: wallet?.isHD,
  isWatchOnly: wallet?.isWatchOnly,
  extendedKey: '',
}

export default walletState
