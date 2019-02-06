import { createContext } from 'react'

interface IWallet {
  msg: string
}

export const initWallet = {
  msg: '',
}

const WalletContext = createContext<IWallet>(initWallet)
export default WalletContext
