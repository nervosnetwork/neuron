import React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'
import { action } from '@storybook/addon-actions'
import SettingTabs from 'components/SettingTabs'
import { initStates, NeuronWalletContext } from 'states'

const dispatch = (dispatchAction: any) => action('dispatch')(dispatchAction)

const meta: Meta<typeof SettingTabs> = {
  component: SettingTabs,
  decorators: [
    withRouter(),
    Component => (
      <NeuronWalletContext.Provider
        value={{
          state: initStates,
          dispatch,
        }}
      >
        <Component />
      </NeuronWalletContext.Provider>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof SettingTabs>

export const Default: Story = {}
