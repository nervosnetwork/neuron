import React from 'react'
import { storiesOf } from '@storybook/react'
import WithdrawDialog from 'components/WithdrawDialog'

const props = {
  onDismiss: () => {},
  onSubmit: () => {},
  record: {
    blockNumber: '0x123',
    blockHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
    capacity: '0x12300000000',
    lock: {
      codeHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
      hashType: 'type',
      args: '0x',
    },
    lockHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
    outPoint: {
      txHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
      index: '0x0',
    },
    depositOutPoint: {
      txHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
      index: '0x0',
    },
    status: 'live' as any,
    type: {
      codeHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
      hashType: 'type',
      args: '0x',
    },
    typeHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
    daoData: '0x00000000',
    timestamp: Date.now().toString(),
    depositTimestamp: Date.now().toString(),
  },
  tipBlockHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
  currentEpoch: '0x00000000',
}

const stories = storiesOf('Withdraw Dialog', module)
stories.add('Basic', () => {
  return <WithdrawDialog {...props} />
})
