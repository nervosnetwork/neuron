import { createContext } from 'react'

interface Wallet {
  name: string
  balance: number
  address: string
  publicKey: Uint8Array
  msg: string
}
export const initWallet: Wallet = {
  name: 'My First #1',
  balance: 0,
  address: 'test address',
  publicKey: new Uint8Array(0),
  msg: '',
}

const WalletContext = createContext<Wallet>(initWallet)
export default WalletContext
