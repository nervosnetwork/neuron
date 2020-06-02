import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import { action } from '@storybook/addon-actions'
import NetworkEditor from 'components/NetworkEditor'
import { initStates, NeuronWalletContext } from 'states'

const stories = storiesOf('Settings', module).addDecorator(StoryRouter())

const dispatch = (dispatchAction: any) => action('dispatch')(dispatchAction)

stories.add('Network Editor', () => {
  return (
    <NeuronWalletContext.Provider
      value={{
        state: initStates,
        dispatch,
      }}
    >
      <NetworkEditor />
    </NeuronWalletContext.Provider>
  )
})
