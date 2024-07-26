import TransactionSize from '../../src/models/transaction-size'
import { bytes as byteUtils } from '@ckb-lumos/lumos/codec'
import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import Script, { ScriptHashType } from '../../src/models/chain/script'
import WitnessArgs from '../../src/models/chain/witness-args'
import Transaction from '../../src/models/chain/transaction'
import Output from '../../src/models/chain/output'

describe('TransactionSize', () => {
  const output = Output.fromObject({
    capacity: '0x174876e800',
    lock: new Script(
      '0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88',
      '0x59a27ef3ba84f061517d13f42cf44ed020610061',
      ScriptHashType.Type
    ),
    type: new Script('0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6', '0x', ScriptHashType.Data),
  })

  const witnessArgs = new WitnessArgs('', '0x', '')

  it('output', () => {
    const result = TransactionSize.output(output)
    expect(result).toEqual(150 + 4)
  })

  it('witnessArgs', () => {
    const result = TransactionSize.witness(witnessArgs)
    expect(result).toEqual(byteUtils.bytify('0x10000000100000001000000010000000').byteLength + 4 + 4)
  })

  it('witnessArgs only lock', () => {
    const witnessArgs = WitnessArgs.emptyLock()

    const result = TransactionSize.witness(witnessArgs)
    expect(result).toEqual(85 + 4 + 4)
  })

  it('witness 0x', () => {
    const result = TransactionSize.witness('0x')
    expect(result).toEqual(4 + 4)
  })

  it('secpLockWitness', () => {
    expect(TransactionSize.secpLockWitness()).toEqual(85 + 4 + 4)
  })

  it('emptyWitness', () => {
    expect(TransactionSize.emptyWitness()).toEqual(4 + 4)
  })

  it('singleMultiSignWitness', () => {
    // 24 bytes larger than secp, for serialized multi sign script
    expect(TransactionSize.singleMultiSignWitness()).toEqual(85 + 20 + 4 + 4 + 4)
  })

  it('empty outputData', () => {
    const data = '0x'
    const length = TransactionSize.outputData(data)
    expect(length).toEqual(8)
  })

  it('outputData with 0x1234abcd', () => {
    const data = '0x1234abcd'
    const length = TransactionSize.outputData(data)
    expect(length).toEqual(12)
  })

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
      },
    ],
    outputsData: ['0x1234', '0x'],
    witnesses: [
      '0x82df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900',
    ],
  }
  const tx = Transaction.fromSDK(sdkTx)

  it('tx', () => {
    const length = TransactionSize.tx(tx)
    expect(length).toEqual(536)
  })

  it('multiSignWitness', () => {
    const witness = TransactionSize.witness
    TransactionSize.witness = jest.fn()
    TransactionSize.multiSignWitness(1, 1, 2)
    expect(TransactionSize.witness).toHaveBeenCalledWith(
      new WitnessArgs('0x00010102' + '0'.repeat(80) + '0'.repeat(130))
    )
    TransactionSize.witness = witness
  })
})
