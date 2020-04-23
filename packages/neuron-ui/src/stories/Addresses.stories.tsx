import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import { withKnobs, text, number } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import Addresses from 'components/Addresses'
import initStates from 'states/initStates'
import { NeuronWalletContext } from 'states/stateProvider'
import addressesStates from './data/addresses'

const stories = storiesOf('Addresses', module).addDecorator(StoryRouter())
const dispatch = action('Dispatch')

Object.entries(addressesStates).forEach(([title, addresses]) => {
  const globalState = { ...initStates, wallet: { ...initStates.wallet, addresses } }
  stories.add(title, () => (
    <NeuronWalletContext.Provider value={{ state: globalState, dispatch }}>
      <Addresses />
    </NeuronWalletContext.Provider>
  ))
})

stories.addDecorator(withKnobs).add('With knobs', () => {
  const addresses = addressesStates['Content List'].map((addr, idx) => ({
    address: text(`${idx}-Address`, addr.address),
    identifier: text(`${idx}-Identifier`, addr.identifier),
    description: text(`${idx}-Description`, addr.description),
    type: number(`${idx}-Type`, addr.type) as 0 | 1,
    txCount: number(`${idx}-Tx count`, addr.txCount),
    balance: text(`${idx}-Balance`, addr.balance),
    index: number(`${idx}-Index`, addr.index),
  }))
  const globalState = { ...initStates, wallet: { ...initStates.wallet, addresses } }
  return (
    <NeuronWalletContext.Provider value={{ state: globalState, dispatch }}>
      <Addresses />
    </NeuronWalletContext.Provider>
  )
})
