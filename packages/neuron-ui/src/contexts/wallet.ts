import { createContext } from 'react'

interface Wallet {
  name: string
  msg: string
}

const WalletContext = createContext<Wallet | null>({ name: 'My First #1', msg: '' })
export default WalletContext
