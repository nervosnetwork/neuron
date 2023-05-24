import React from 'react'
import { ComponentStory } from '@storybook/react'
import NervosDAORecord, { DAORecordProps } from 'components/NervosDAORecord'

export default {
  title: 'Nervos DAO Record',
  component: NervosDAORecord,
}

const basicProps: Omit<DAORecordProps, 'onToggle'> = {
  capacity: '10200000000',
  lock: {
    args: '0x4cb6874775d45dc34d8fdef092aa566f235d7c20',
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    hashType: 'type',
  },
  type: {
    args: '0x',
    codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
    hashType: 'type',
  },
  lockHash: '0x7ef7e11ea074143d202e2d1f78accef4d6d8ec59834a26dd89fecfc30f11d594',
  typeHash: '0xcc77c4deac05d68ab5b26828f0bf4565a8d73113d7bb7e92b8362b8a74e58e58',
  status: 'live',
  daoData: '0x0000000000000000',
  data: '0x0000000000000000',
  multiSignBlake160: null,
  blockHash: '0x170ac54645030ec9c0bca74c52a3413121590fd76d4f8928e62f87f21e3d0b37',
  onClick: () => {},

  connectionStatus: 'online',
  outPoint: {
    txHash: '0xaeb6299dd6441a5833fbfee6aab0ca8b664388c892a9596c1b8b9532c81dde59',
    index: '0',
  },
  depositEpoch: '0xa000000030c',
  currentEpoch: '0xa0002000300',
  genesisBlockTimestamp: 0,
  withdrawCapacity: '0x25ff7a600',
  timestamp: '1583215001719',
  tipBlockTimestamp: 1583215001719,
  blockNumber: '7712',
}

const Template: ComponentStory<typeof NervosDAORecord> = props => {
  return <NervosDAORecord {...props} />
}

export const Depositing = Template.bind({})
Depositing.args = {
  ...basicProps,
  blockNumber: undefined as any,
  status: 'sent',
}

export const ImmatureForWithdraw = Template.bind({})
ImmatureForWithdraw.args = {
  ...basicProps,
  depositEpoch: '0xa000100030a', // 778.1
  currentEpoch: '0xa000000030e', // 782
}

export const Deposited4Epochs = Template.bind({})
Deposited4Epochs.args = {
  ...basicProps,
  depositEpoch: '0xa000000030b', // 779
  currentEpoch: '0xa000000030f', // 783
}

export const Deposited4Point1Epochs = Template.bind({})
Deposited4Point1Epochs.args = {
  ...basicProps,
  depositEpoch: '0xa000900030a', // 778.9
  currentEpoch: '0xa000000030f', // 783
}

export const DepositedLess138Epochs = Template.bind({})
DepositedLess138Epochs.args = {
  ...basicProps,
  depositEpoch: '0xa0001000285', // 645.1
  currentEpoch: '0xa000000030f', // 783
}
DepositedLess138Epochs.storyName = 'Deposited 137.9 epochs'

export const Deposited138Epochs = Template.bind({})
Deposited138Epochs.args = {
  ...basicProps,
  depositEpoch: '0xa0000000285', // 645
  currentEpoch: '0xa000000030f', // 783
}
Deposited138Epochs.storyName = 'Deposited 138 epochs'

export const DepositedBigThan138Epochs = Template.bind({})
DepositedBigThan138Epochs.args = {
  ...basicProps,
  depositEpoch: '0xa0009000284', // 644.9
  currentEpoch: '0xa000000030f', // 783
}
DepositedBigThan138Epochs.storyName = 'Deposited 138.1 epochs'

export const Withdrawing = Template.bind({})
Withdrawing.args = {
  ...basicProps,
  depositInfo: {
    txHash: 'deposit tx hash',
    timestamp: new Date('2020-02-02').getTime().toString(),
  },
  withdrawInfo: {
    txHash: 'withdraw tx hash',
    timestamp: new Date('2020-02-03').getTime().toString(),
  },
  depositEpoch: '0xa000900030a', // 778.9
  currentEpoch: '0xa000000030f', // 783
  status: 'sent',
}

export const Withdrawn5Epochs = Template.bind({})
Withdrawn5Epochs.args = {
  ...basicProps,
  depositInfo: {
    txHash: 'deposit tx hash',
    timestamp: new Date('2020-02-02').getTime().toString(),
  },
  withdrawInfo: {
    txHash: 'withdraw tx hash',
    timestamp: new Date('2020-02-03').getTime().toString(),
  },
  depositEpoch: '0xa0000000300', // 768
  currentEpoch: '0xa000000030f', // 783
}

export const ImmatureForUnlock = Template.bind({})
ImmatureForUnlock.args = {
  ...basicProps,
  depositInfo: {
    txHash: 'deposit tx hash',
    timestamp: new Date('2020-02-02').getTime().toString(),
  },
  withdrawInfo: {
    txHash: 'withdraw tx hash',
    timestamp: new Date('2020-02-03').getTime().toString(),
  },
  depositEpoch: '0xa0000000300', // 768
  currentEpoch: '0xa00010003b4', // 948.1
}

export const Unlockable = Template.bind({})
Unlockable.args = {
  ...basicProps,
  depositInfo: {
    txHash: 'deposit tx hash',
    timestamp: new Date('2020-02-02').getTime().toString(),
  },
  withdrawInfo: {
    txHash: 'withdraw tx hash',
    timestamp: new Date('2020-02-03').getTime().toString(),
  },
  depositEpoch: '0xa000900030a', // 778.9
  currentEpoch: '0xa0009000476', // 1142.9
}

export const Unlocking = Template.bind({})
Unlocking.args = {
  ...basicProps,
  depositInfo: {
    txHash: 'deposit tx hash',
    timestamp: new Date('2020-02-02').toString().toString(),
  },
  withdrawInfo: {
    txHash: 'withdraw tx hash',
    timestamp: new Date('2020-02-03').getTime().toString(),
  },
  unlockInfo: {
    txHash: 'unlock tx hash',
    timestamp: new Date().getTime().toString(),
  },
  depositEpoch: '0xa000900030a', // 778.9
  currentEpoch: '0xa0009000476', // 1142.9
  status: 'pending',
}

export const Unfolded = Template.bind({})
Unfolded.args = {
  ...basicProps,
  depositOutPoint: undefined,
  depositEpoch: '0xa0009000284', // 644.9
  currentEpoch: '0xa000000030f', // 783
  depositTimestamp: (Date.now() - 25 * 3600000).toString(),
  unlockInfo: {
    timestamp: Date.now().toString(),
    txHash: 'unlock tx hash',
  },
  withdrawInfo: {
    timestamp: (Date.now() - 24 * 3600_000).toString(),
    txHash: 'withdraw tx hash',
  },
}
