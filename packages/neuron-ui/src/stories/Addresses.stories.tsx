// TODO: figure out how to mock context
import React from 'react'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import { withKnobs, text, number } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import Addresses from 'components/Addresses'
import initStates from 'states/initStates'
import addressesStates from './data/addresses'

const dispatch = (a: any) => action('Dispatch')(JSON.stringify(a, null, 2))
const stories = storiesOf('Addresses', module).addDecorator(StoryRouter())

Object.entries(addressesStates).forEach(([title, addresses]) => {
  const globalState = { ...initStates, wallet: { ...initStates.wallet, addresses } }
  console.info(globalState)
  stories.add(title, () => <Addresses dispatch={dispatch} />)
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
  console.info(globalState)
  return <Addresses dispatch={dispatch} />
})
