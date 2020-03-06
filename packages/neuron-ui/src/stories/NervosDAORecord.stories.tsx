import React from 'react'
import { storiesOf } from '@storybook/react'
import NervosDAORecord, { DAORecordProps } from 'components/NervosDAORecord'

const stories = storiesOf('Nervos DAO Record', module)

const basicProps: DAORecordProps = {
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
  blockHash: '0x170ac54645030ec9c0bca74c52a3413121590fd76d4f8928e62f87f21e3d0b37',
  onCompensationPeriodExplanationClick: () => {},
  onClick: () => {},

  connectionStatus: 'online',
  outPoint: {
    txHash: '0xaeb6299dd6441a5833fbfee6aab0ca8b664388c892a9596c1b8b9532c81dde59',
    index: '0',
  },
  compensationPeriod: { targetEpochValue: 951.2 },
  depositEpoch: '0xa000000030c',
  currentEpoch: '0xa0002000300',
  genesisBlockTimestamp: 0,
  withdrawCapacity: '0x25ff7a600',
  tipBlockNumber: '7800',
  timestamp: '1583215001719',
  tipBlockTimestamp: 1583215001719,
  blockNumber: '7712',
}

const props: { [index: string]: DAORecordProps } = {
  test: {
    ...basicProps,
    depositOutPoint: undefined,
    depositEpoch: '0xa000900030a',
    currentEpoch: '0xa000000030f',
  },
  'Current - Deposit is less than 4': {
    ...basicProps,
    depositOutPoint: undefined,
    depositEpoch: '0xa000100030a', // 778.1
    currentEpoch: '0xa000000030e', // 782
  },
  'Current - Deposit is equal to 4': {
    ...basicProps,

    depositOutPoint: undefined,
    depositEpoch: '0xa000000030b', // 779
    currentEpoch: '0xa000000030f', // 783
  },
  'Current - Deposit is greater than 4': {
    ...basicProps,
    depositOutPoint: undefined,
    depositEpoch: '0xa000900030a', // 778.9
    currentEpoch: '0xa000000030f', // 783
  },
  'Loading withdrawing epoch': {
    ...basicProps,
    depositOutPoint: {
      txHash: '0x000',
      index: '0',
    },
    depositEpoch: '0xa000900030a', // 778.9
    currentEpoch: '0xa000000030f', // 783
  },
  'withdrawing stage': {
    ...basicProps,
    depositOutPoint: {
      txHash: '0x000',
      index: '0',
    },
    depositEpoch: '0xa000900030a', // 778.9
    currentEpoch: '0xa0009000476', // 1142.9
    // withdrawingEpoch: 0xa000900040a // 1034.9
    // withdrawEpoch: 1142.9
  },
}

Object.keys(props).forEach(name => {
  stories.add(name, () => {
    return <NervosDAORecord {...props[name]} />
  })
})
