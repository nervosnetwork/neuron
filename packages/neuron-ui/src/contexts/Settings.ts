import { createContext } from 'react'

interface IWalletSettings {
  seeds: string
  seedsValid: boolean
  passwordValid: boolean
}

export const initSettings: IWalletSettings = {
  seeds: 'supporse only 1 is valid seed',
  seedsValid: false,
  passwordValid: false,
}

const WalletContext = createContext<IWalletSettings>(initSettings)
export default WalletContext
