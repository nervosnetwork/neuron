import React from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import StoryRouter from 'storybook-react-router'
import { storiesOf } from '@storybook/react'
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
