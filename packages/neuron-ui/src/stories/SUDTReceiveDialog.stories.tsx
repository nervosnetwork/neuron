import React from 'react'
import { withRouter } from 'storybook-addon-react-router-v6'
import { storiesOf } from '@storybook/react'
import SUDTReceiveDialog from 'components/SUDTReceiveDialog'

const stories = storiesOf('SUDT Receive', module).addDecorator(withRouter())

const ComponentParams = () => (
  <SUDTReceiveDialog
    data={{
      address: 'ckt1q9gry5zg8stq8ruq5wfz3lm5wn2k7qw3ulsfmdhe98f2j1',
      accountName: 'account name',
      tokenName: 'token name',
      symbol: 'CKB',
    }}
  />
)

stories.add('basic', () => <ComponentParams />)
