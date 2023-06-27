import 'theme'
import 'styles/index.scss'
import 'styles/layout.scss'
import 'styles/theme.scss'
import 'utils/i18n'
import 'stories/styles.scss'
import React from 'react'
import { action } from '@storybook/addon-actions'
import { NeuronWalletContext, initStates } from '../src/states'

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  }
}

const dispatch = action('Dispatch')

BigInt.prototype['toJSON'] = function() { return this.toString() }

export const decorators = [
  (Story, { argTypes, args }) => {
    const globalArgTypes = Object.keys(argTypes).filter(v => argTypes[v]?.isGlobal)
    const globalStates = globalArgTypes.reduce((pre, cur) => args[cur] ? ({
      ...pre,
      [cur]: args[cur]
    }) : pre, initStates)
    return (
      <NeuronWalletContext.Provider value={{ state: globalStates, dispatch }}>
        <Story />
      </NeuronWalletContext.Provider>
    )
  },
];

