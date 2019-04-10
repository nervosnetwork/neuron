import { createContext } from 'react'

import chain from './chain'
import wallet from './wallet'
import settings from './settings'

export * from './chain'
export * from './wallet'
export * from './settings'

export const initNeuronWallet = {
  chain,
  wallet,
  settings,
}

const NeuronWalletContext = createContext<typeof initNeuronWallet>(initNeuronWallet)
export default NeuronWalletContext
