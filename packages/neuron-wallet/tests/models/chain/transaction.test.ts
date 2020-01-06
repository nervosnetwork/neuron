import { TransactionInterface, TransactionStatus, Transaction } from '../../../src/models/chain/transaction'
import { DepType } from '../../../src/models/chain/cell-dep'
import { ScriptHashType } from '../../../src/models/chain/script'
import { WitnessArgs } from '../../../src/models/chain/witness-args'
import { OutputStatus } from '../../../src/models/chain/output'

describe('Transaction', () => {
  const hash = '0x' + '0'.repeat(64)
  const timestamp = '1578284127550'
  const transactionInterface: TransactionInterface = {
    hash,
    version: '0',
    cellDeps: [
      {
        outPoint: {
          txHash: hash,
          index: '0',
        },
        depType: DepType.DepGroup
      }
    ],
    headerDeps: [hash],
    inputs: [
      {
        previousOutput: {
          txHash: hash,
          index: '0',
        },
        since: '0'
      }
    ],
    outputs: [
      {
        capacity: '1000',
        data: '0x',
        lock: {
          codeHash: hash,
          args: '0x',
          hashType: ScriptHashType.Type,
        },
        type: {
          codeHash: hash,
          args: '0x00',
          hashType: ScriptHashType.Type,
        },
        outPoint: {
          txHash: hash,
          index: '0',
        },
        status: OutputStatus.Live,
        daoData: '0x',
      }
    ],
    witnesses: [
      '0x',
      {
        lock: WitnessArgs.EMPTY_LOCK,
      }
    ],
    value: '100',
    fee: '1',
    type: 'send',
    status: TransactionStatus.Success,
    description: '0x00',
    nervosDao: false,
    blockNumber: '0',
    blockHash: hash,
    timestamp,
  }

  const tx = new Transaction(transactionInterface)

  it('new', () => {
    expect(tx.hash).toEqual(hash)
  })

  it('computeHash', () => {
    expect(tx.computeHash()).toEqual("0xf09ef3072ec48a89ed772abd98feb1dd0f3c5074fcc00628c1a82e697aca92e4")
  })

  it('toInterface', () => {
    const i = tx.toInterface()
    expect(Object.keys(i).length).toEqual(Object.keys({ ...tx }).length)
  })

  it('toSDK / fromSDK', () => {
    const json = require('./fixtures/tx.json')
    const s = Transaction.fromSDK(json)
    expect(s.toSDK()).toEqual(json)
  })
})
