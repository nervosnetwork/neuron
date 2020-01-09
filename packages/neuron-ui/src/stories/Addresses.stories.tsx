import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, number } from '@storybook/addon-knobs'
import Addresses from 'components/Addresses'
import initStates from 'states/initStates'
import addressesStates from './data/addresses'

const stories = storiesOf('Addresses', module)

Object.entries(addressesStates).forEach(([title, addresses]) => {
  stories.add(title, () => (
    <Addresses {...initStates} wallet={{ ...initStates.wallet, addresses }} dispatch={() => {}} />
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
  return <Addresses {...initStates} wallet={{ ...initStates.wallet, addresses }} dispatch={() => {}} />
})
