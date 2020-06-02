import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import { action } from '@storybook/addon-actions'
import SettingTabs from 'components/SettingTabs'
import { initStates, NeuronWalletContext } from 'states'

const stories = storiesOf('Settings', module).addDecorator(StoryRouter())

const dispatch = (dispatchAction: any) => action('dispatch')(dispatchAction)

stories.add('Setting Tabs', () => {
  return (
    <NeuronWalletContext.Provider
      value={{
        state: initStates,
        dispatch,
      }}
    >
      <SettingTabs />
    </NeuronWalletContext.Provider>
  )
})
