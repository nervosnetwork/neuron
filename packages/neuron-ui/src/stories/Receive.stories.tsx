import React from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import StoryRouter from 'storybook-react-router'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, number } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import Receive from 'components/Receive'
import initStates from 'states/initStates'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import addresses from './data/addresses'

const states = {
  'Has no addresses': {
    ...initStates,
    wallet: {
      ...initStates.wallet,
      addresses: addresses['Empty List'],
    },
    dispatch: (dispatchAction: any) => action(dispatchAction),
  },
  'Has addresses': {
    ...initStates,
    wallet: {
      ...initStates.wallet,
      addresses: addresses['Content List'],
    },
    dispatch: (dispatchAction: any) => action(dispatchAction),
  },
}

const ReceiveWithRouteProps = (props: StateWithDispatch) => {
  return (
    <Route
      to="/123"
      render={(routeProps: RouteComponentProps<{ address: string }>) => <Receive {...routeProps} {...props} />}
    />
  )
}

const stories = storiesOf('Receive', module).addDecorator(StoryRouter())

Object.entries(states).forEach(([title, props]) => {
  stories.add(title, () => <ReceiveWithRouteProps {...props} />)
})

stories.addDecorator(withKnobs).add('With knobs', () => {
  const props = {
    ...initStates,
    wallet: {
      ...initStates.wallet,
      addresses: addresses['Content List'].slice(1).map(addr => ({
        address: text(`Address`, addr.address),
        identifier: text(`Identifier`, addr.identifier),
        description: text(`Description`, addr.description),
        type: number(`Type`, addr.type) as 0 | 1,
        txCount: number(`Tx count`, 0),
        balance: text(`Balance`, addr.balance),
      })),
    },
  }
  return <ReceiveWithRouteProps {...props} dispatch={() => {}} />
})
