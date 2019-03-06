import { createContext } from 'react'

export interface WalletNames {
  name: string[]
}
export const initWalletNames: WalletNames = {
  name: [],
}

const WalletNamesContext = createContext<WalletNames>(initWalletNames)
export default WalletNamesContext
