import React from 'react'
import { Route, Link, Routes } from 'react-router-dom'
import { withRouter } from 'storybook-addon-react-router-v6'
import { storiesOf } from '@storybook/react'
import SUDTReceive from 'components/SUDTReceive'

const stories = storiesOf('SUDT Receive', module).addDecorator(withRouter())

const ComponentParams = () => (
  <div>
    <Link to="/s-udt/receive?address=ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2j1&accountName=account name&tokenName=token name">
      Link
    </Link>
    <Routes>
      <Route path="/s-udt/receive" element={SUDTReceive} />
    </Routes>
  </div>
)

stories.add('basic', () => <ComponentParams />)
