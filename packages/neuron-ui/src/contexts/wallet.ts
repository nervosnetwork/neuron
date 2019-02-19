import { createContext } from 'react'

interface Wallet {
  name: string
  wallet: any
  msg: string
}
export const initWallet = {
  name: 'My First #1',
  wallet: {},
  msg: '',
}

const WalletContext = createContext<Wallet>(initWallet)
export default WalletContext
