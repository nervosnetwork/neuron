import React, { useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import NeuronWalletContext from 'contexts/NeuronWallet'
import { initProviders, ProviderDispatch, reducer } from './reducer'
import { useChannelListeners } from './hooks'

const withProviders = (Comp: React.ComponentType<{ providerDispatch: ProviderDispatch }>) => (
  props: React.Props<any>
) => {
  const [providers, dispatch] = useReducer(reducer, initProviders)
  const { chain } = providers
  const [, i18n] = useTranslation()

  useChannelListeners(i18n, chain, dispatch)

  return (
    <NeuronWalletContext.Provider value={providers}>
      <Comp {...props} providerDispatch={dispatch} />
    </NeuronWalletContext.Provider>
  )
}

export default withProviders
