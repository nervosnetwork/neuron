import { Meta, StoryObj } from '@storybook/react'
import NervosDAO from 'components/NervosDAO'
import { withRouter } from 'storybook-addon-react-router-v6'
import { initStates } from 'states'
import transactions from './data/transactions'
import addresses from './data/addresses'

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

const meta: Meta<typeof NervosDAO> = {
  component: NervosDAO,
  argTypes: {
    app: { control: 'object', isGlobal: true },
    wallet: { control: 'object', isGlobal: true },
    chain: { control: 'object', isGlobal: true },
    settings: { control: 'object', isGlobal: true },
    nervosDAO: { control: 'object', isGlobal: true },
  },
  decorators: [withRouter],
}

export default meta

type Story = StoryObj<typeof NervosDAO>

export const HasNoReceipts: Story = {
  args: {
    ...stateTemplate,
    nervosDAO: {
      records: [],
    },
  },
}

export const HasReceipts: Story = {
  args: stateTemplate,
}
