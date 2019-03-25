import { createContext } from 'react'
import { loadNetworks } from '../utils/localStorage'
import { DEFAULT_NETWORKS } from '../utils/const'

import { Network } from './Chain'
import { Wallet } from './Wallet'

export const defaultNetworks = (() => {
  const cachedNetworks = loadNetworks()
  if (cachedNetworks.length) {
    return cachedNetworks
  }
  return DEFAULT_NETWORKS
})()

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
  networks: defaultNetworks,
  wallets: [],
}

const WalletContext = createContext<WalletSettings>(initSettings)
export default WalletContext
