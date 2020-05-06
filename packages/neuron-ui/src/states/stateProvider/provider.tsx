import React, { createContext, useReducer, useContext } from 'react'
import initStates from 'states/init'
import { StateDispatch, reducer } from './reducer'

const basicDispatch = console.info

export const NeuronWalletContext = createContext<{ state: State.AppWithNeuronWallet; dispatch: StateDispatch }>({
  state: initStates,
  dispatch: basicDispatch,
})

export const withProvider = (Comp: React.ComponentType) => (props: React.Props<any>) => {
  const [providers, dispatch] = useReducer(reducer, initStates)

  Object.defineProperty(Comp, 'displayName', {
    value: 'ComponentWithNeuronWallet',
  })

  return (
    <NeuronWalletContext.Provider value={{ state: providers, dispatch }}>
      <Comp {...props} />
    </NeuronWalletContext.Provider>
  )
}

export const useState = () => useContext(NeuronWalletContext).state
export const useDispatch = () => useContext(NeuronWalletContext).dispatch

export default withProvider
