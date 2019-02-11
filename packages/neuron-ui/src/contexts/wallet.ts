import { createContext } from 'react'

interface IWallet {
  name: string
  msg: string
}

export const initWallet: IWallet = {
  name: 'CurrentWallet',
  msg: '',
}

const WalletContext = createContext<IWallet>(initWallet)
export default WalletContext
