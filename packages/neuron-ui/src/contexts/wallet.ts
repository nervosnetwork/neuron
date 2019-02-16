import { createContext } from 'react'

interface Wallet {
  name: string
  msg: string
}

const WalletContext = createContext<Wallet | null>(null)
export default WalletContext
