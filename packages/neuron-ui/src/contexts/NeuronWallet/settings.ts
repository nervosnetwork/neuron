import { Network } from './chain'
import { Wallet } from './wallet'

export interface Settings {
  networks: Network[]
  wallets: Wallet[]
}

export const settingsState: Settings = {
  networks: [],
  wallets: [],
}

export default settingsState
