import { CellDep, OutPoint, Input, Output, RawTransaction, Transaction, WitnessArgs } from '@ckb-lumos/lumos'
import { bytes, blockchain } from '@ckb-lumos/lumos/codec'

/**
 * @param outPoint always required when serialize
 * @returns OutPoint
 */
const transformOutPoint = (outPoint: CKBComponents.OutPoint | null): OutPoint => {
  if (!outPoint) {
    throw new Error('cellDep.outPoint is undefined')
  }
  return outPoint
}
const transformCellDep = (cellDep: CKBComponents.CellDep): CellDep => {
  return {
    outPoint: transformOutPoint(cellDep.outPoint),
    depType: cellDep.depType,
  }
}
const transformCellDeps = (cellDeps: CKBComponents.CellDep[]): CellDep[] => {
  return cellDeps.map(transformCellDep)
}
const transformHeaderDeps = (headerDeps: CKBComponents.Hash256[]): CKBComponents.Hash256[] => {
  return headerDeps
}
const transformInput = (input: CKBComponents.CellInput): Input => {
  return {
    previousOutput: transformOutPoint(input.previousOutput),
    since: input.since,
  }
}
const transformInputs = (inputs: CKBComponents.CellInput[]): Input[] => {
  return inputs.map(transformInput)
}
const transformOutput = (output: CKBComponents.CellOutput): Output => {
  return {
    capacity: output.capacity,
    lock: output.lock,
    type: output.type ?? undefined,
  }
}
const transformOutputs = (outputs: CKBComponents.CellOutput[]): Output[] => {
  return outputs.map(transformOutput)
}
const transformRawTransaction = (rawTransaction: CKBComponents.RawTransaction): RawTransaction => {
  return {
    version: rawTransaction.version,
    cellDeps: transformCellDeps(rawTransaction.cellDeps),
    headerDeps: transformHeaderDeps(rawTransaction.headerDeps),
    inputs: transformInputs(rawTransaction.inputs),
    outputs: transformOutputs(rawTransaction.outputs),
    outputsData: rawTransaction.outputsData,
  }
}
const transformTransaction = (rawTransaction: CKBComponents.RawTransaction): Transaction => {
  return {
    ...transformRawTransaction(rawTransaction),
    witnesses: rawTransaction.witnesses,
  }
}
const transformWitnessArgs = (witnessArgs: CKBComponents.WitnessArgs): WitnessArgs => {
  const isEmptyHex = (hex: string | undefined | null): boolean => {
    return !hex || hex === '0x'
  }
  return {
    lock: isEmptyHex(witnessArgs.lock) ? undefined : witnessArgs.lock,
    inputType: isEmptyHex(witnessArgs.inputType) ? undefined : witnessArgs.inputType,
    outputType: isEmptyHex(witnessArgs.outputType) ? undefined : witnessArgs.outputType,
  }
}

const serializeOutPoint = (outPoint: CKBComponents.OutPoint): string => {
  return bytes.hexify(blockchain.OutPoint.pack(outPoint))
}
const serializeCellDep = (cellDep: CKBComponents.CellDep): string => {
  return bytes.hexify(blockchain.CellDep.pack(transformCellDep(cellDep)))
}
const serializeInput = (cellInput: CKBComponents.CellInput): string => {
  return bytes.hexify(blockchain.CellInput.pack(transformInput(cellInput)))
}
const serializeOutput = (cellOutput: CKBComponents.CellOutput): string => {
  return bytes.hexify(blockchain.CellOutput.pack(transformOutput(cellOutput)))
}
const serializeRawTransaction = (rawTransaction: CKBComponents.RawTransaction): string => {
  return bytes.hexify(blockchain.RawTransaction.pack(transformRawTransaction(rawTransaction)))
}
const serializeTransaction = (transaction: CKBComponents.Transaction): string => {
  return bytes.hexify(blockchain.Transaction.pack(transformTransaction(transaction)))
}
const serializeWitnessArgs = (witnessArgs: CKBComponents.WitnessArgs): string => {
  return bytes.hexify(blockchain.WitnessArgs.pack(transformWitnessArgs(witnessArgs)))
}

export {
  serializeOutPoint,
  serializeCellDep,
  serializeInput,
  serializeOutput,
  serializeRawTransaction,
  serializeTransaction,
  serializeWitnessArgs,
}
