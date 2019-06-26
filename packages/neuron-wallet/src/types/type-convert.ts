import { Block, BlockHeader, Transaction, Input, OutPoint, Cell, Script, CellOutPoint } from './cell-types'

// convert CKBComponents to types
export default class TypeConvert {
  static toBlock(block: CKBComponents.Block): Block {
    const blockHeader = TypeConvert.toBlockHeader(block.header)
    return {
      header: blockHeader,
      transactions: block.transactions.map(tx => TypeConvert.toTransaction(tx, blockHeader)),
    }
  }

  static toBlockHeader(blockHeader: CKBComponents.BlockHeader): BlockHeader {
    return {
      version: blockHeader.version,
      timestamp: blockHeader.timestamp.toString(),
      hash: blockHeader.hash,
      parentHash: blockHeader.parentHash,
      number: blockHeader.number.toString(),
    }
  }

  static toTransaction(transaction: CKBComponents.Transaction, blockHeader?: BlockHeader): Transaction {
    const tx: Transaction = {
      hash: transaction.hash,
      version: transaction.version,
      deps: transaction.deps,
      witnesses: transaction.witnesses,
      inputs: transaction.inputs.map(input => TypeConvert.toInput(input)),
      outputs: transaction.outputs.map(output => TypeConvert.toOutput(output)),
    }
    if (blockHeader) {
      tx.timestamp = blockHeader.timestamp
      tx.blockNumber = blockHeader.number
      tx.blockHash = blockHeader.hash
    }
    return tx
  }

  static toInput(input: CKBComponents.CellInput): Input {
    return {
      previousOutput: input.previousOutput,
      since: input.since,
    }
  }

  static toOutPoint(outPoint: CKBComponents.OutPoint): OutPoint {
    const cell: CellOutPoint = {
      txHash: outPoint.cell!.txHash,
      index: outPoint.cell!.index,
    }
    return {
      blockHash: null,
      cell,
    }
  }

  static toOutput(output: CKBComponents.CellOutput): Cell {
    return {
      capacity: output.capacity.toString(),
      lock: TypeConvert.toScript(output.lock),
    }
  }

  static toScript(script: CKBComponents.Script): Script {
    return {
      args: script.args,
      codeHash: script.codeHash,
    }
  }
}
