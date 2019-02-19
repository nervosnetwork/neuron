import { createContext } from 'react'

interface Wallet {
  name: string
  wallet: any
  msg: string
}

const WalletContext = createContext<Wallet>({ name: 'My First #1', wallet: {}, msg: '' })
export default WalletContext
