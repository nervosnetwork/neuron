import Transaction, { TransactionStatus } from '../../../src/models/chain/transaction'
import CellDep, { DepType } from '../../../src/models/chain/cell-dep'
import Script, { ScriptHashType } from '../../../src/models/chain/script'
import Output, { OutputStatus } from '../../../src/models/chain/output'
import WitnessArgs from '../../../src/models/chain/witness-args'
import OutPoint from '../../../src/models/chain/out-point'
import Input from '../../../src/models/chain/input'

describe('Transaction', () => {
  const hash = '0x' + '0'.repeat(64)
  const timestamp = '1578284127550'
  const transactionInterface = {
    hash,
    version: '0',
    cellDeps: [
      new CellDep(new OutPoint(hash, '0'), DepType.DepGroup)
    ],
    headerDeps: [hash],
    inputs: [
      new Input(new OutPoint(hash, '0'), '0')
    ],
    outputs: [
      Output.fromObject({
        capacity: '1000',
        data: '0x',
        lock: new Script(hash, '0x', ScriptHashType.Type),
        type: new Script(hash, '0x00', ScriptHashType.Type),
        outPoint: new OutPoint(hash, '0'),
        status: OutputStatus.Live,
        daoData: '0x',
      })
    ],
    witnesses: [
      '0x',
      new WitnessArgs(WitnessArgs.EMPTY_LOCK),
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

  const tx = Transaction.fromObject(transactionInterface)

  it('new', () => {
    expect(tx.hash).toEqual(hash)
  })

  it('computeHash', () => {
    expect(tx.computeHash()).toEqual("0xf09ef3072ec48a89ed772abd98feb1dd0f3c5074fcc00628c1a82e697aca92e4")
  })

  it('toSDK / fromSDK', () => {
    const json = require('./fixtures/tx.json')
    const s = Transaction.fromSDK(json)
    expect(s.toSDK()).toEqual(json)
  })
})
