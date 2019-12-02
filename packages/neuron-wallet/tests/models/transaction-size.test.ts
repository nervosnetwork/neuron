import { Cell, ScriptHashType, WitnessArgs } from '../../src/types/cell-types'
import TransactionSize from '../../src/models/transaction-size'
import HexUtils from '../../src/utils/hex'
import TypeConvert from '../../src/types/type-convert'

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

  it('empty outputData', () => {
    const data = "0x"
    const length = TransactionSize.outputData(data)
    expect(length).toEqual(8)
  })

  it('outputData with 0x1234abcd', () => {
    const data = "0x1234abcd"
    const length = TransactionSize.outputData(data)
    expect(length).toEqual(12)
  })

  const sdkTx: CKBComponents.Transaction = {
    "hash": '',
    "version": "0x0",
    "cellDeps": [
      {
        "outPoint": {
          "txHash": "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
          "index": "0x0"
        },
        "depType": "depGroup"
      },
      {
        "outPoint": {
          "txHash": "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
          "index": "0x2"
        },
        "depType": "code"
      }
    ],
    "headerDeps": [],
    "inputs": [
      {
        "previousOutput": {
          "txHash": "0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65",
          "index": "0x1"
        },
        "since": "0x0"
      }
    ],
    "outputs": [
      {
        "capacity": "0x174876e800",
        "lock": {
          "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
          "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
          "hashType": "type"
        },
        "type": {
          "codeHash": "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
          "args": "0x",
          "hashType": "data"
        }
      },
      {
        "capacity": "0x59e1416a5000",
        "lock": {
          "codeHash": "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
          "args": "0x59a27ef3ba84f061517d13f42cf44ed020610061",
          "hashType": "type"
        },
        "type": null
      }
    ],
    "outputsData": ["0x1234", "0x"],
    "witnesses": [
      "0x82df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900"
    ]
  }
  const tx = TypeConvert.toTransaction(sdkTx)

  it('tx', () => {
    const length = TransactionSize.tx(tx)
    expect(length).toEqual(536)
  })
})
