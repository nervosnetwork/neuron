import { Network } from './chain'
import { WalletIdentity } from './wallet'

export interface Settings {
  showAddressBook: boolean
  networks: Network[]
  wallets: WalletIdentity[]
}

export const settingsState: Settings = {
  showAddressBook: false,
  networks: [],
  wallets: [],
}

export default settingsState
