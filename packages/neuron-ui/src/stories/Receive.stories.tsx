import React from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import StoryRouter from 'storybook-react-router'
import { storiesOf } from '@storybook/react'
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
