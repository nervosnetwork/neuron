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
    cellDeps: [new CellDep(new OutPoint(hash, '0'), DepType.DepGroup)],
    headerDeps: [hash],
    inputs: [new Input(new OutPoint(hash, '0'), '0')],
    outputs: [
      Output.fromObject({
        capacity: '1000',
        data: '0x',
        lock: new Script(hash, '0x', ScriptHashType.Type),
        type: new Script(hash, '0x00', ScriptHashType.Type),
        outPoint: new OutPoint(hash, '0'),
        status: OutputStatus.Live,
        daoData: '0x',
      }),
    ],
    witnesses: ['0x', new WitnessArgs(WitnessArgs.EMPTY_LOCK)],
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
    expect(tx.computeHash()).toEqual('0xf09ef3072ec48a89ed772abd98feb1dd0f3c5074fcc00628c1a82e697aca92e4')
  })

  it('toSDK / fromSDK', () => {
    const json = require('./fixtures/tx.json')
    const s = Transaction.fromSDK(json)
    expect(s.toSDK()).toEqual(json)
  })

  describe('setSignatures', () => {
    const sdkTx: CKBComponents.Transaction = {
      hash: '',
      version: '0x0',
      cellDeps: [
        {
          outPoint: {
            txHash: '0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b',
            index: '0x0',
          },
          depType: 'depGroup',
        },
        {
          outPoint: {
            txHash: '0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60',
            index: '0x2',
          },
          depType: 'code',
        },
      ],
      headerDeps: [],
      inputs: [
        {
          previousOutput: {
            txHash: '0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65',
            index: '0x1',
          },
          since: '0x0',
        },
      ],
      outputs: [
        {
          capacity: '0x174876e800',
          lock: {
            codeHash: '0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88',
            args: '0x59a27ef3ba84f061517d13f42cf44ed020610061',
            hashType: 'type',
          },
          type: {
            codeHash: '0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6',
            args: '0x',
            hashType: 'data',
          },
        },
        {
          capacity: '0x59e1416a5000',
          lock: {
            codeHash: '0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88',
            args: '0x59a27ef3ba84f061517d13f42cf44ed020610061',
            hashType: 'type',
          },
          type: null,
        },
      ],
      outputsData: ['0x1234', '0x'],
      witnesses: [
        '0x82df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900',
      ],
    }
    const tx = Transaction.fromSDK(sdkTx)

    it('lockHash not exist', () => {
      tx.setSignatures('lockhash', 'blake1')
      expect(tx.signatures['lockhash']).toHaveLength(1)
    })
    it('lockHash exist', () => {
      tx.setSignatures('lockhash', 'blake2')
      expect(tx.signatures['lockhash']).toHaveLength(2)
    })
  })
})
