import { createContext } from 'react'

import chain from './chain'
import wallet from './wallet'
import settings from './settings'
import messages from './messages'

export * from './chain'
export * from './wallet'
export * from './settings'
export * from './messages'

export const initNeuronWallet = {
  chain,
  wallet,
  settings,
  messages,
}

const NeuronWalletContext = createContext<typeof initNeuronWallet>(initNeuronWallet)
export default NeuronWalletContext
