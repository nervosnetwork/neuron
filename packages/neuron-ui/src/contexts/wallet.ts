import { createContext } from 'react'

interface Wallet {
  name: string
  msg: string
}

export const initWallet: Wallet | null = null

const WalletContext = createContext<Wallet | null>(null)
export default WalletContext
