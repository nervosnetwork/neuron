import { createContext } from 'react'

interface IWallet {
  msg: string
}

export const initWallet: IWallet = {
  msg: '',
}

const WalletContext = createContext<IWallet>(initWallet)
export default WalletContext
