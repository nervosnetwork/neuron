import React from 'react'
import { Route, Link } from 'react-router-dom'
import StoryRouter from 'storybook-react-router'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import SUDTReceive from 'components/SUDTReceive'
import { initStates, NeuronWalletContext } from 'states'

const dispatch = action('Dispatch')

const stories = storiesOf('SUDT Receive', module).addDecorator(StoryRouter())
const ComponentParams = () => (
  <div>
    <Link to="/s-udt/receive?address=ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2j1&accountName=account name&tokenName=token name">
      Link
    </Link>
    <Route path="/s-udt/receive" component={SUDTReceive} />
  </div>
)

stories.add('basic', () => (
  <NeuronWalletContext.Provider value={{ state: initStates, dispatch }}>
    <ComponentParams />
  </NeuronWalletContext.Provider>
))
