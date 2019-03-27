import { createContext } from 'react'

import { Network } from './Chain'
import { Wallet } from './Wallet'

interface WalletSettings {
  seeds: string
  name: string
  seedsValid: boolean
  passwordValid: boolean
  networks: Network[]
  wallets: Wallet[]
}

export const initSettings: WalletSettings = {
  seeds: 'supporse only 1 is valid seed',
  name: '',
  seedsValid: false,
  passwordValid: false,
  networks: [],
  wallets: [],
}

const WalletContext = createContext<WalletSettings>(initSettings)
export default WalletContext
