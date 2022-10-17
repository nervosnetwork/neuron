import React from 'react'
import { storiesOf } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import { action } from '@storybook/addon-actions'
import WalletEditor from 'components/WalletEditor'
import { initStates, NeuronWalletContext } from 'states'

const wallets: State.WalletIdentity[] = [{ id: 'wallet-id', name: 'wallet name' }]

const stories = storiesOf('Settings', module).addDecorator(withRouter())

const dispatch = (dispatchAction: any) => action('dispatch')(dispatchAction)

stories.add('Wallet Editor', () => {
  return (
    <NeuronWalletContext.Provider
      value={{
        state: {
          ...initStates,
          wallet: { ...initStates.wallet, id: wallets[0].id, name: wallets[0].name },
          settings: { ...initStates.settings, wallets },
        },
        dispatch,
      }}
    >
      <WalletEditor />
    </NeuronWalletContext.Provider>
  )
})
