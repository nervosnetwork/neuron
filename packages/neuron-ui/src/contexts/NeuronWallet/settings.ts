import { Network } from './chain'
import { Wallet } from './wallet'

export interface Settings {
  seeds: string
  name: string
  seedsValid: boolean
  passwordValid: boolean
  networks: Network[]
  wallets: Wallet[]
}

export const settingsState: Settings = {
  seeds: 'supporse only 1 is valid seed',
  name: '',
  seedsValid: false,
  passwordValid: false,
  networks: [],
  wallets: [],
}

export default settingsState
