import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import NervosDAO from 'components/NervosDAO'
import { initStates, NeuronWalletContext } from 'states'
import transactions from './data/transactions'
import addresses from './data/addresses'

const dispatch = action('Dispatch')

const stateTemplate = {
  ...initStates,
  app: {
    ...initStates.app,
    epoch: '1',
    difficulty: BigInt('0x111111'),
    chain: 'chain_dev',
  },
  wallet: {
    ...initStates.wallet,
    id: 'wallet id',
    name: 'Current Wallet Name',
    balance: '0x21300000000',
    addresses: addresses['Content List'],
  },
  chain: {
    ...initStates.chain,
    connectionStatus: 'online' as any,
    networkID: 'testnet',
    transactions: { ...initStates.chain.transactions, items: transactions[`Content List`] },
    tipBlockNumber: '123',
  },
  settings: {
    ...initStates.settings,
    networks: [
      {
        id: 'testnet',
        name: 'Testnet',
        remote: 'http://testnet.nervos.com',
        chain: 'ckb_testnet',
        type: 1 as 0 | 1,
      },
    ],
  },
  nervosDAO: {
    records: [
      {
        blockNumber: '0x123',
        blockHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
        capacity: '0x12300000000',
        lock: {
          codeHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
          hashType: 'type' as any,
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
          hashType: 'type' as any,
          args: '0x',
        },
        typeHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab61',
        daoData: '0x00000000',
        data: '0x00000000',
        multiSignBlake160: null,
        timestamp: Date.now().toString(),
        depositTimestamp: Date.now().toString(),
      },
      {
        blockNumber: '0x123',
        blockHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab62',
        capacity: '0x12300000000',
        lock: {
          codeHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab62',
          hashType: 'type' as any,
          args: '0x',
        },
        lockHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab62',
        outPoint: {
          txHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab62',
          index: '0x0',
        },
        status: 'live' as any,
        type: {
          codeHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab62',
          hashType: 'type' as any,
          args: '0x',
        },
        typeHash: '0x70abeeaa2ed08b7d7659341a122b9a2f2ede99bb6bd0df7398d7ffe488beab62',
        daoData: '0x00000000',
        data: '0x00000000',
        multiSignBlake160: null,
        timestamp: Date.now().toString(),
        depositTimestamp: Date.now().toString(),
      },
    ],
  },
}

const states = {
  'Has no receipts': {
    ...stateTemplate,
    nervosDAO: {
      records: [],
    },
  },
  'Has receipts': stateTemplate,
}

const stories = storiesOf(`Nervos DAO`, module)

Object.entries(states).forEach(([title, state]) => {
  console.info(state)
  stories.add(title, () => (
    <NeuronWalletContext.Provider value={{ state, dispatch }}>
      <NervosDAO />
    </NeuronWalletContext.Provider>
  ))
})

stories.addDecorator(withKnobs).add('With knobs', () => {
  const state = {
    dispatch: (dispatchAction: any) => action(dispatchAction),
    ...initStates,
    app: {
      ...initStates.app,
      epoch: text('Epoch', '1'),
      difficulty: BigInt(100000),
      chain: text('Chain', 'chain_dev'),
    },
    wallet: {
      ...initStates.wallet,
      id: text('Wallet ID', 'wallet id'),
      name: text('Wallet Name', 'Current Wallet Name'),
      balance: text('Balance', '213'),
    },
    chain: {
      ...initStates.chain,
      networkID: text('Network ID', 'testnet'),
      tipBlockNumber: text('Tip block number', '123'),
    },
    settings: {
      ...initStates.settings,
      networks: [
        {
          id: text('Network iD', 'testnet'),
          name: text('Network Name', 'Testnet'),
          remote: text('Network Address', 'http://testnet.nervos.com'),
          chain: text('Chain', 'ckb_testnet'),
          type: 1 as 0 | 1,
        },
      ],
    },
  }
  console.info(state)
  return (
    <NeuronWalletContext.Provider value={{ state, dispatch }}>
      <NervosDAO />
    </NeuronWalletContext.Provider>
  )
})
