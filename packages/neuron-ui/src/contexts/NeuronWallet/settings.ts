import { Network } from './chain'
import { WalletIdentity } from './wallet'

export interface Settings {
  networks: Network[]
  wallets: WalletIdentity[]
}

export const settingsState: Settings = {
  networks: [],
  wallets: [],
}

export default settingsState
