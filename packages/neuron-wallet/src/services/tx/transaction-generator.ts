import { TransactionWithoutHash, Cell, DepType, Input } from 'types/cell-types'
import CellsService, { MIN_CELL_CAPACITY } from 'services/cells'
import LockUtils from 'models/lock-utils'
import { CapacityTooSmall } from 'exceptions'
import { TargetOutput } from './params'
import DaoUtils from 'models/dao-utils'
import FeeMode from 'models/fee-mode'
import TransactionSize from '../../models/transaction-size'

export class TransactionGenerator {
  public static txSerializedSizeInBlockWithoutInputs = (outputLength: number) : number => {
    /*
    * add a transaction to block need 4 Bytes for offset
    * a transaction with empty inputs/outputs/cellDeps/header/outputs_data/witnesses need 68 Bytes
    * every cellDep need 37 Bytes, transaction in Neuron only one cellDep
    * every output without typeScript & with lock in secp need 97 Bytes and 4 Bytes for offset (add to transaction)
    * every outputsData in "0x" need 4 Bytes and 4 Bytes for offset
    */
    return 4 + 68 + 37 * 1 + (4 + 97 + 4 + 4) * outputLength
  }

  public static txSerializedSizeInBlockWithoutInputsForDeposit = (): number => {
    /*
    * add a transaction to block need 4 Bytes for offset
    * a transaction with empty inputs/outputs/cellDeps/header/outputs_data/witnesses need 68 Bytes
    * every cellDep need 37 Bytes, transaction for deposit needs 2 cellDeps(lock / type)
    * every output without typeScript & with lock in secp need 97 Bytes and 4 Bytes for offset (add to transaction)
    * every output for deposit with typeScript in dao & with lock in secp need 150 Bytes and 4 Bytes for offset (add to transaction)
    * every outputsData in "0x" need 4 Bytes and 4 Bytes for offset
    * every outputsData in "0x0000000000000000" need 12 Bytes and 4 Bytes for offset
    */
   return 4 + 68 + 37 * 2 + (4 + 97 + 4 + 4) + (150 + 4 + 12 + 4)
  }

  public static txSerializedSizeInBlockWithoutInputsForDepositAll = (): number => {
    /*
    * add a transaction to block need 4 Bytes for offset
    * a transaction with empty inputs/outputs/cellDeps/header/outputs_data/witnesses need 68 Bytes
    * every cellDep need 37 Bytes, transaction for deposit needs 2 cellDeps(lock / type)
    * every output for deposit with typeScript in dao & with lock in secp need 150 Bytes and 4 Bytes for offset (add to transaction)
    * every outputsData in "0x0000000000000000" need 12 Bytes and 4 Bytes for offset
    */
   return 4 + 68 + 37 * 2 + (150 + 4 + 12 + 4)
  }

  public static txSerializedSizeInBlockWithoputInputsForWitdrawStep1 = (): number => {
    // a fixed input for (4+44+89) Bytes
    // a fixed headerDep for 32 Bytes
    return TransactionGenerator.txSerializedSizeInBlockWithoutInputsForDeposit() + (4 + 44 + 89) + 32
  }

  public static txSerializedSizeInBlockForWithdraw = (): number => {
    /*
    * add a transaction to block need 4 Bytes for offset
    * a transaction with empty inputs/outputs/cellDeps/header/outputs_data/witnesses need 68 Bytes
    * every cellDep need 37 Bytes, transaction for withdraw step2 needs 2 cellDeps(lock / type)
    * every headerDep need 32 Bytes, transaction for withdraw step2 need 2 headerDeps
    * every output without typeScript & with lock in secp need 97 Bytes and 4 Bytes for offset (add to transaction)
    * every outputsData in "0x" need 4 Bytes and 4 Bytes for offset
    * only one input, for 44 Bytes
    * one witness with extra inputType "0x0000000000000000", 101 Bytes, extra 4 Bytes for add to transaction
    */
    return 4 + 68 + 37 * 2 + 32 * 2 + (4 + 97 + 4 + 4) + 44 + (101 + 4)
  }

  public static txFee = (size: number, feeRate: bigint) => {
    const ratio = BigInt(1000)
    const base = BigInt(size) * feeRate
    const fee = base / ratio
    if (fee * ratio < base) {
      return fee + BigInt(1)
    }
    return fee
  }

  // lockHashes for each inputs

  public static CHANGE_OUTPUT_SIZE = 101
  public static CHANGE_OUTPUT_DATA_SIZE = 8
  public static generateTx = async (
    lockHashes: string[],
    targetOutputs: TargetOutput[],
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<TransactionWithoutHash> => {
    const { codeHash, outPoint, hashType } = await LockUtils.systemScript()

    const needCapacities: bigint = targetOutputs
      .map(o => BigInt(o.capacity))
      .reduce((result, c) => result + c, BigInt(0))

    const minCellCapacity = BigInt(MIN_CELL_CAPACITY)

    const outputs: Cell[] = targetOutputs.map(o => {
      const { capacity, address } = o

      if (BigInt(capacity) < minCellCapacity) {
        throw new CapacityTooSmall()
      }

      const blake160: string = LockUtils.addressToBlake160(address)

      const output: Cell = {
        capacity,
        data: '0x',
        lock: {
          codeHash,
          args: blake160,
          hashType,
        },
      }

      return output
    })

    const tx: TransactionWithoutHash = {
      version: '0',
      cellDeps: [
        {
          outPoint,
          depType: DepType.DepGroup,
        },
      ],
      headerDeps: [],
      inputs: [],
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: [],
    }

    const baseSize: number = TransactionSize.tx(tx)
    const {
      inputs,
      capacities,
      finalFee,
      hasChangeOutput,
    } = await CellsService.gatherInputs(
      needCapacities.toString(),
      lockHashes,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
    )
    const finalFeeInt = BigInt(finalFee)
    tx.inputs = inputs
    tx.fee = finalFee

    // change
    if (hasChangeOutput) {
      const changeBlake160: string = LockUtils.addressToBlake160(changeAddress)

      const changeCapacity = BigInt(capacities) - needCapacities - finalFeeInt

      const output: Cell = {
        capacity: changeCapacity.toString(),
        data: '0x',
        lock: {
          codeHash,
          args: changeBlake160,
          hashType,
        },
      }

      outputs.push(output)
      tx.outputsData!.push('0x')
    }

    return tx
  }

  public static generateDepositTx = async (
    lockHashes: string[],
    capacity: string,
    receiveAddress: string,
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<TransactionWithoutHash> => {
    const { codeHash, outPoint, hashType } = await LockUtils.systemScript()
    const blake160: string = LockUtils.addressToBlake160(receiveAddress)
    const daoScriptInfo = await DaoUtils.daoScript()

    const capacityInt: bigint = BigInt(capacity)

    const output: Cell = {
      capacity: capacity,
      lock: {
        codeHash,
        hashType,
        args: blake160,
      },
      type: {
        codeHash: daoScriptInfo.codeHash,
        hashType: daoScriptInfo.hashType,
        args: '0x',
      },
      data: '0x0000000000000000',
      daoData: '0x0000000000000000',
    }
    output.typeHash = LockUtils.computeScriptHash(output.type!)

    const outputs: Cell[] = [output]

    const tx: TransactionWithoutHash = {
      version: '0',
      cellDeps: [
        {
          outPoint,
          depType: DepType.DepGroup,
        },
        {
          outPoint: daoScriptInfo.outPoint,
          depType: DepType.Code,
        },
      ],
      headerDeps: [],
      inputs: [],
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: []
    }

    const baseSize: number = TransactionSize.tx(tx)

    const {
      inputs,
      capacities,
      finalFee,
      hasChangeOutput,
    } = await CellsService.gatherInputs(
      capacityInt.toString(),
      lockHashes,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
    )
    const finalFeeInt = BigInt(finalFee)
    tx.inputs = inputs

    // change
    if (hasChangeOutput) {
      const changeBlake160: string = LockUtils.addressToBlake160(changeAddress)

      const changeCapacity = BigInt(capacities) - capacityInt - finalFeeInt

      const changeOutput: Cell = {
        capacity: changeCapacity.toString(),
        data: '0x',
        lock: {
          codeHash,
          args: changeBlake160,
          hashType
        },
      }

      outputs.push(changeOutput)
      tx.outputsData!.push(changeOutput.data!)
    }

    tx.fee = finalFee

    return tx
  }

  public static generateDepositAllTx = async (
    lockHashes: string[],
    receiveAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<TransactionWithoutHash> => {
    const { codeHash, outPoint, hashType } = await LockUtils.systemScript()
    const blake160: string = LockUtils.addressToBlake160(receiveAddress)
    const daoScriptInfo = await DaoUtils.daoScript()

    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const allInputs: Input[] = await CellsService.gatherAllInputs(lockHashes)
    const totalCapacity: bigint = allInputs
      .map(input => BigInt(input.capacity))
      .reduce((result, c) => result + c, BigInt(0))

    const output: Cell = {
      capacity: totalCapacity.toString(),
      lock: {
        codeHash,
        hashType,
        args: blake160,
      },
      type: {
        codeHash: daoScriptInfo.codeHash,
        hashType: daoScriptInfo.hashType,
        args: '0x',
      },
      data: '0x0000000000000000',
      daoData: '0x0000000000000000',
    }
    output.typeHash = LockUtils.computeScriptHash(output.type!)

    const outputs: Cell[] = [output]

    const tx: TransactionWithoutHash = {
      version: '0',
      cellDeps: [
        {
          outPoint,
          depType: DepType.DepGroup,
        },
        {
          outPoint: daoScriptInfo.outPoint,
          depType: DepType.Code,
        },
      ],
      headerDeps: [],
      inputs: allInputs,
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: [],
    }

    // change
    let finalFee: bigint = feeInt
    if (mode.isFeeRateMode()) {
      const size: number =
        TransactionGenerator.txSerializedSizeInBlockWithoutInputsForDepositAll() +
          allInputs.length * (TransactionSize.input() + TransactionSize.witness({
            lock: '0x' + '0'.repeat(130),
            inputType: undefined,
            outputType: undefined,
          }))
      finalFee = TransactionGenerator.txFee(size, feeRateInt)
    }

    output.capacity = (BigInt(output.capacity) - finalFee).toString()
    tx.fee = finalFee.toString()

    return tx
  }
}

export default TransactionGenerator
