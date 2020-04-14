import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import { action } from '@storybook/addon-actions'
import Navbar from 'containers/Navbar'
import initStates from 'states/initStates'
import { NeuronWalletContext } from 'states/stateProvider'

const wallets: State.WalletIdentity[] = [{ id: 'wallet id', name: 'wallet name' }]

const stories = storiesOf('Navbar', module).addDecorator(StoryRouter())

const dispatch = (dispatchAction: any) => action('dispatch')(dispatchAction)

stories.add('Basic', () => {
  return (
    <NeuronWalletContext.Provider
      value={{
        state: {
          ...initStates,
          wallet: { ...initStates.wallet, id: 'wallet id', name: 'wallet name' },
          settings: { ...initStates.settings, wallets },
        },
        dispatch,
      }}
    >
      <Navbar />
    </NeuronWalletContext.Provider>
  )
})
