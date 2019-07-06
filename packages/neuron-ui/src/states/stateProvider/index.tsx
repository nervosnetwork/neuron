import React, { createContext, useReducer, useContext } from 'react'
import initStates from 'states/initStates'
import { StateDispatch, reducer } from './reducer'

export const NeuronWalletContext = createContext<typeof initStates>(initStates)

const withProviders = (Comp: React.ComponentType<{ dispatch: StateDispatch }>) => (props: React.Props<any>) => {
  const [providers, dispatch] = useReducer(reducer, initStates)

  Object.defineProperty(Comp, 'displayName', {
    value: 'ComponentWithNeuronWallet',
  })

  return (
    <NeuronWalletContext.Provider value={providers}>
      <Comp {...props} dispatch={dispatch} />
    </NeuronWalletContext.Provider>
  )
}

export const useState = () => useContext(NeuronWalletContext)

export default withProviders
