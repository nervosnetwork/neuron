import { Cell, ScriptHashType, WitnessArgs } from '../../src/types/cell-types'
import TransactionSize from '../../src/models/transaction-size'
import HexUtils from '../../src/utils/hex'

describe('TransactionSize', () => {
  const output: Cell = {
    "capacity": "0x174876e800",
    "lock": {
      "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
      "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
      "hashType": "type" as ScriptHashType
    },
    "type": {
      "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
      "args": "0x",
      "hashType": "data" as ScriptHashType
    }
  }

  const witnessArgs: WitnessArgs = {
    "lock": "",
    "inputType": "0x",
    "outputType": ""
  }

  it('output', () => {
    const result = TransactionSize.output(output)
    expect(result).toEqual(150 + 4)
  })

  it('witnessArgs', () => {
    const result = TransactionSize.witness(witnessArgs)
    expect(result).toEqual(HexUtils.byteLength("0x10000000100000001000000010000000") + 4 + 4)
  })

  it('witnessArgs only lock', () => {
    const witnessArgs: WitnessArgs = {
      lock: '0x' + '0'.repeat(130),
      inputType: undefined,
      outputType: undefined,
    }

    const result = TransactionSize.witness(witnessArgs)
    expect(result).toEqual(85 + 4 + 4)
  })

  it('empty witness', () => {
    const result = TransactionSize.witness('0x')
    expect(result).toEqual(4 + 4)
  })
})
