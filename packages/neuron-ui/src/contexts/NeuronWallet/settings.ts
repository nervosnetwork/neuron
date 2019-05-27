import { Network } from './chain'
import { PlainWallet } from './wallet'

export interface Settings {
  networks: Network[]
  wallets: PlainWallet[]
}

export const settingsState: Settings = {
  networks: [],
  wallets: [],
}

export default settingsState
