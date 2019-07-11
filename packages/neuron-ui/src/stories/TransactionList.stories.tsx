import React from 'react'
import { storiesOf } from '@storybook/react'
import TransactionList from 'components/TransactionList'

const states: {
  [title: string]: State.Transaction[]
} = {
  'Empty List': [],
  'Content List': [
    {
      type: 'send',
      createdAt: (Date.now() - 100000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
      description: 'description of sending transaction',
      status: 'pending',
    },
    {
      type: 'receive',
      createdAt: (Date.now() - 200000).toString(),
      updatedAt: '',
      timestamp: '',
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab62',
      description: 'description of receiving transaction',
      status: 'pending',
    },
    {
      type: 'send',
      createdAt: '',
      updatedAt: '',
      timestamp: (Date.now() - 300000).toString(),
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab63',
      description: 'description of sending transaction',
      status: 'success',
    },
    {
      type: 'receive',
      createdAt: '',
      updatedAt: '',
      timestamp: (Date.now() - 400000).toString(),
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab64',
      description: 'description of receiving transaction',
      status: 'success',
    },
    {
      type: 'send',
      createdAt: '',
      updatedAt: '',
      timestamp: (Date.now() - 500000).toString(),
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab65',
      description: 'description of sending transaction',
      status: 'failed',
    },
    {
      type: 'receive',
      createdAt: '',
      updatedAt: '',
      timestamp: (Date.now() - 600000).toString(),
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab66',
      description: 'description of receiving transaction',
      status: 'failed',
    },
    {
      type: 'send',
      createdAt: '',
      updatedAt: '',
      timestamp: new Date('2019-05-18').getTime().toString(),
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab67',
      description: 'description of sending transaction',
      status: 'failed',
    },
    {
      type: 'receive',
      createdAt: '',
      updatedAt: '',
      timestamp: new Date('2019-05-18').getTime().toString(),
      value: '10000',
      hash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab68',
      description: 'description of receiving transaction',
      status: 'failed',
    },
  ],
}
const stories = storiesOf('TransactionList', module)
Object.entries(states).forEach(([title, list]) => {
  stories.add(title, () => <TransactionList walletID="1" items={list} dispatch={() => {}} />)
})
