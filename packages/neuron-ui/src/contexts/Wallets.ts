import { createContext } from 'react'
import { Wallet } from './Wallet'

export interface Wallets {
  items: Wallet[]
}

export const initWallets: Wallets = {
  items: [],
}

const WalletsContext = createContext<Wallets>(initWallets)
export default WalletsContext
