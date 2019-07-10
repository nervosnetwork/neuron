import React from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import StoryRouter from 'storybook-react-router'
import { storiesOf } from '@storybook/react'
import Addresses from 'components/Addresses'
import initStates from 'states/initStates'

const states: { [title: string]: State.Address[] } = {
  'Empty List': [],
  'Content List': [
    {
      address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2j3',
      identifier: '4040ba0ed8a361c59c30bb92f46128f95eaa9bcb',
      description: 'description',
      type: 0,
      txCount: 123,
      balance: '10000',
    },
    {
      address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2jd',
      identifier: '4040ba0ed8a361c59c30bb92f46128f95eaa9bcd',
      description: 'description',
      type: 1,
      txCount: 123,
      balance: '10000',
    },
  ],
}
const AddressWithRouteProps = ({ addresses }: { addresses: State.Address[] }) => (
  <Route
    path="/"
    render={(props: RouteComponentProps) => (
      <Addresses {...props} {...initStates} wallet={{ ...initStates.wallet, addresses }} dispatch={() => {}} />
    )}
  />
)

const stories = storiesOf('Addresses', module).addDecorator(StoryRouter())

Object.entries(states).forEach(([title, list]) => {
  stories.add(title, () => <AddressWithRouteProps addresses={list} />)
})
