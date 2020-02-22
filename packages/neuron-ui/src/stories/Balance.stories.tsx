import React from 'react'
import { storiesOf } from '@storybook/react'
import Balance from 'widgets/Balance'

const balances = ['0', '0.00000001', '0.99999999', '1', '1.000000001', '111111111111111111111111111111111.111111111111']

const stories = storiesOf('Balance', module)
balances.forEach(balance => {
  stories.add(`Balance ${balance} CKB`, () => {
    return <Balance balance={balance} />
  })
})
