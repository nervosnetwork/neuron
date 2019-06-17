import { Transaction, Input, Cell, Script, TransactionWithoutHash } from './types'

export default class ConvertTo {
  public static toSdkTransaction = (tx: Transaction): CKBComponents.Transaction => {
    const transaction: CKBComponents.Transaction = {
      ...tx,
      inputs: tx.inputs!.map(input => ConvertTo.toSdkInput(input)),
      outputs: tx.outputs!.map(output => ConvertTo.toSdkOutput(output)),
      deps: tx.deps!,
      witnesses: tx.witnesses!,
    }
    return transaction
  }

  public static toSdkTxWithoutHash = (tx: TransactionWithoutHash): any => {
    const transaction = {
      ...tx,
      inputs: tx.inputs!.map(input => ConvertTo.toSdkInput(input)),
      outputs: tx.outputs!.map(output => ConvertTo.toSdkOutput(output)),
      deps: tx.deps!,
      witnesses: tx.witnesses!,
    }
    return transaction
  }

  public static toSdkInput = (input: Input): CKBComponents.CellInput => {
    return {
      since: input.since!,
      previousOutput: input.previousOutput!,
    }
  }

  public static toSdkOutput = (output: Cell): CKBComponents.CellOutput => {
    const type = output.type ? ConvertTo.toSdkScript(output.type) : undefined

    return {
      ...output,
      data: output.data!,
      lock: ConvertTo.toSdkScript(output.lock!),
      type,
    }
  }

  public static toSdkScript = (script: Script): CKBComponents.Script => {
    return {
      ...script,
      args: script.args!,
      codeHash: script.codeHash!,
    }
  }
}
