import HexUtils from 'utils/hex';
import { TransactionWithStatus } from './cell-types';
import {
  Block,
  BlockHeader,
  Transaction,
  Input,
  OutPoint,
  Cell,
  Script,
  CellDep,
  DepType,
  ScriptHashType,
} from './cell-types'

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
      version: HexUtils.toDecimal(blockHeader.version),
      timestamp: HexUtils.toDecimal(blockHeader.timestamp),
      hash: blockHeader.hash,
      parentHash: blockHeader.parentHash,
      number: HexUtils.toDecimal(blockHeader.number),
    }
  }

  static toTransaction(transaction: CKBComponents.Transaction, blockHeader?: BlockHeader): Transaction {
    const tx: Transaction = {
      hash: transaction.hash,
      version: HexUtils.toDecimal(transaction.version),
      cellDeps: transaction.cellDeps.map(cellDep => TypeConvert.toCellDep(cellDep)),
      headerDeps: transaction.headerDeps,
      witnesses: transaction.witnesses,
      inputs: transaction.inputs.map(input => TypeConvert.toInput(input)),
      outputs: transaction.outputs.map(output => TypeConvert.toOutput(output)),
      outputsData: transaction.outputsData,
    }
    if (blockHeader) {
      tx.timestamp = HexUtils.toDecimal(blockHeader.timestamp)
      tx.blockNumber = HexUtils.toDecimal(blockHeader.number)
      tx.blockHash = blockHeader.hash
    }
    return tx
  }

  static toTransactionWithStatus(transactionWithStatus: CKBComponents.TransactionWithStatus): TransactionWithStatus {
    return {
      transaction: TypeConvert.toTransaction(transactionWithStatus.transaction),
      txStatus: {
        blockHash: transactionWithStatus.txStatus.blockHash,
        status: transactionWithStatus.txStatus.status,
      }
    }
  }

  static toCellDep(cellDep: CKBComponents.CellDep): CellDep {
    return {
      outPoint: cellDep.outPoint,
      depType: cellDep.depType as DepType,
    }
  }

  static toInput(input: CKBComponents.CellInput): Input {
    let previousOutput: OutPoint | null = null
    if (input.previousOutput) {
      previousOutput = TypeConvert.toOutPoint(input.previousOutput)
    }
    return {
      previousOutput,
      since: HexUtils.toDecimal(input.since),
    }
  }

  static toOutPoint(outPoint: CKBComponents.OutPoint): OutPoint {
    return {
      txHash: outPoint.txHash,
      index: HexUtils.toDecimal(outPoint.index),
    }
  }

  static toOutput(output: CKBComponents.CellOutput): Cell {
    let type: Script | undefined
    if (output.type) {
      type = TypeConvert.toScript(output.type)
    }
    return {
      capacity: HexUtils.toDecimal(output.capacity),
      lock: TypeConvert.toScript(output.lock),
      type,
    }
  }

  static toScript(script: CKBComponents.Script): Script {
    return {
      args: script.args,
      codeHash: script.codeHash,
      hashType: script.hashType as ScriptHashType,
    }
  }
}
