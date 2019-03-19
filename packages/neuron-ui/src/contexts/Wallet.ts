import { createContext } from 'react'

export interface Wallet {
  name: string
  id: string
  balance: number
  address: string
  publicKey: Uint8Array
  msg: string
}
export const initWallet: Wallet = {
  name: '',
  id: '',
  balance: 0,
  address: '',
  publicKey: new Uint8Array(0),
  msg: '',
}

const WalletContext = createContext<Wallet>(initWallet)
export default WalletContext
