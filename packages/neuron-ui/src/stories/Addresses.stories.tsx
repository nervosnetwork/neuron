import React from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import StoryRouter from 'storybook-react-router'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, number } from '@storybook/addon-knobs'
import Addresses from 'components/Addresses'
import initStates from 'states/initStates'
import addressesStates from './data/addresses'

const AddressWithRouteProps = ({ addresses }: { addresses: State.Address[] }) => (
  <Route
    path="/"
    render={(props: RouteComponentProps) => (
      <Addresses {...props} {...initStates} wallet={{ ...initStates.wallet, addresses }} dispatch={() => {}} />
    )}
  />
)

const stories = storiesOf('Addresses', module).addDecorator(StoryRouter())

Object.entries(addressesStates).forEach(([title, list]) => {
  stories.add(title, () => <AddressWithRouteProps addresses={list} />)
})

stories.addDecorator(withKnobs).add('With knobs', () => {
  const addrs = addressesStates['Content List'].map((addr, idx) => ({
    address: text(`${idx}-Address`, addr.address),
    identifier: text(`${idx}-Identifier`, addr.identifier),
    description: text(`${idx}-Description`, addr.description),
    type: number(`${idx}-Type`, addr.type) as 0 | 1,
    txCount: number(`${idx}-Tx count`, addr.txCount),
    balance: text(`${idx}-Balance`, addr.balance),
  }))
  return <AddressWithRouteProps addresses={addrs} />
})
