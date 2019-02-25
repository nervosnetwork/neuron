import { createContext } from 'react'

interface Wallet {
  name: string
  balance: number
  wallet: { address: string; publicKey: Uint8Array }
  msg: string
}
export const initWallet: Wallet | null = {
  name: 'My First #1',
  balance: 0,
  wallet: {
    address: '',
    publicKey: new Uint8Array(0),
  },
  msg: '',
}

const WalletContext = createContext<Wallet | null>(initWallet)
export default WalletContext
