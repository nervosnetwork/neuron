import { createContext } from 'react'

interface IWalletSettings {
  language: string
  switchLanguage: Function
  seeds: string
  name: string
  seedsValid: boolean
  passwordValid: boolean
}

export const initSettings: IWalletSettings = {
  language: 'en',
  switchLanguage: () => {},
  seeds: 'supporse only 1 is valid seed',
  name: '',
  seedsValid: false,
  passwordValid: false,
}

const WalletContext = createContext<IWalletSettings>(initSettings)
export default WalletContext
