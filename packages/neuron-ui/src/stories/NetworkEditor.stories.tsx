import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { withRouter } from 'storybook-addon-react-router-v6'
import NetworkEditor from 'components/NetworkEditor'
import { initStates, NeuronWalletContext } from 'states'

const stories = storiesOf('Settings', module).addDecorator(withRouter())

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
