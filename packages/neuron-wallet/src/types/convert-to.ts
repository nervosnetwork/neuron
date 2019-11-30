import { Transaction, Input, Cell, Script, TransactionWithoutHash, CellDep, OutPoint } from './cell-types'
import HexUtils from 'utils/hex'
import { WitnessArgs } from 'types/cell-types'

export default class ConvertTo {
  public static toSdkTransaction = (tx: Transaction): CKBComponents.Transaction => {
    const transaction: CKBComponents.Transaction = {
      hash: tx.hash,
      version: HexUtils.toHex(tx.version),
      inputs: tx.inputs!.map(input => ConvertTo.toSdkInput(input)),
      outputs: tx.outputs!.map(output => ConvertTo.toSdkOutput(output)),
      cellDeps: tx.cellDeps ? tx.cellDeps.map(cellDep => ConvertTo.toSdkCellDep(cellDep)) : [],
      headerDeps: tx.headerDeps || [],
      outputsData: tx.outputsData as string[],
      witnesses: tx.witnesses!,
    }
    return transaction
  }

  static toSdkCellDep(cellDep: CellDep): CKBComponents.CellDep {
    return {
      outPoint: cellDep.outPoint as OutPoint,
      depType: cellDep.depType as CKBComponents.DepType,
    }
  }

  public static toSdkTxWithoutHash = (tx: TransactionWithoutHash): CKBComponents.RawTransaction => {
    const transaction = {
      version: HexUtils.toHex(tx.version),
      inputs: tx.inputs!.map(input => ConvertTo.toSdkInput(input)),
      outputs: tx.outputs!.map(output => ConvertTo.toSdkOutput(output)),
      cellDeps: tx.cellDeps ? tx.cellDeps.map(cellDep => ConvertTo.toSdkCellDep(cellDep)) : [],
      headerDeps: tx.headerDeps || [],
      outputsData: tx.outputsData as string[],
      witnesses: tx.witnesses!,
    }
    return transaction
  }

  public static toSdkInput = (input: Input): CKBComponents.CellInput => {
    return {
      since: HexUtils.toHex(input.since!),
      previousOutput: ConvertTo.toSdkOutPoint(input.previousOutput!),
    }
  }

  public static toSdkOutput = (output: Cell): CKBComponents.CellOutput => {
    const type = output.type ? ConvertTo.toSdkScript(output.type) : undefined

    return {
      capacity: HexUtils.toHex(output.capacity),
      lock: ConvertTo.toSdkScript(output.lock!),
      type,
    }
  }

  public static toSdkScript = (script: Script): CKBComponents.Script => {
    return {
      args: script.args!,
      codeHash: script.codeHash!,
      hashType: script.hashType,
    }
  }

  public static toSdkOutPoint = (outPoint: OutPoint): CKBComponents.OutPoint => {
    return {
      txHash: outPoint.txHash,
      index: HexUtils.toHex(outPoint.index),
    }
  }

  public static toSdkWitnessArgs = (witnessArgs: WitnessArgs): CKBComponents.WitnessArgs => {
    return {
      lock: witnessArgs.lock,
      inputType: witnessArgs.inputType,
      outputType: witnessArgs.outputType,
    }
  }
}
