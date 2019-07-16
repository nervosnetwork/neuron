import { addresses, currentWallet } from 'utils/localCache'

const wallet = currentWallet.load()

export const walletState: State.Wallet = {
  name: wallet.name || '',
  id: wallet.id || '',
  balance: '0',
  addresses: addresses.load(),
  sending: false,
}

export default walletState
