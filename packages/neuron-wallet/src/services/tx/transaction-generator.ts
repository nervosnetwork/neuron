import { TransactionWithoutHash, Cell, DepType } from 'types/cell-types'
import CellsService, { MIN_CELL_CAPACITY } from 'services/cells'
import LockUtils from 'models/lock-utils'
import { CapacityTooSmall } from 'exceptions'
import { TargetOutput } from './params'
import DaoUtils from 'models/dao-utils'
import FeeMode from 'models/fee-mode'

export class TransactionGenerator {
  private static txSerializedSizeInBlockWithoutInputs = (outputLength: number) : number => {
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
    * every output for deposit with typeScript in dao & with lock in secp need 130 Bytes and 4 Bytes for offset (add to transaction)
    * every outputsData in "0x" need 4 Bytes and 4 Bytes for offset
    * every outputsData in "0x0000000000000000" need 12 Bytes and 4 Bytes for offset
    */
   return 4 + 68 + 37 * 2 + (4 + 97 + 4 + 4) + (130 + 4 + 12 + 4)
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
   return 4 + 68 + 37 * 2 + 32 * 2 + (4 + 97 + 4 + 4) + (101 + 4)
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
  public static generateTx = async (
    lockHashes: string[],
    targetOutputs: TargetOutput[],
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<TransactionWithoutHash> => {
    const { codeHash, outPoint, hashType } = await LockUtils.systemScript()

    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const sizeWithoutInputs: number = TransactionGenerator.txSerializedSizeInBlockWithoutInputs(
      targetOutputs.length + 1
    )
    const feeWithoutInputs: bigint = TransactionGenerator.txFee(sizeWithoutInputs, feeRateInt)

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

    let gatherCapacities = needCapacities
    if (mode.isFeeRateMode()) {
      gatherCapacities = needCapacities + feeWithoutInputs
    }
    const {
      inputs,
      capacities,
      needFee
    } = await CellsService.gatherInputs(
      gatherCapacities.toString(),
      lockHashes,
      fee,
      feeRate
    )
    const needFeeInt = BigInt(needFee)
    const totalFee = feeWithoutInputs + needFeeInt

    // change
    if (
      mode.isFeeMode() && BigInt(capacities) > needCapacities + feeInt ||
      mode.isFeeRateMode() && BigInt(capacities) > needCapacities + feeWithoutInputs + needFeeInt
    ) {
      const changeBlake160: string = LockUtils.addressToBlake160(changeAddress)

      let changeCapacity = BigInt(capacities) - needCapacities - feeInt
      if (mode.isFeeRateMode()) {
        changeCapacity = BigInt(capacities) - needCapacities - totalFee
      }

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
    }

    return {
      version: '0',
      cellDeps: [
        {
          outPoint,
          depType: DepType.DepGroup,
        },
      ],
      headerDeps: [],
      inputs,
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: [],
    }
  }

  public static generateDepositTx = async (
    lockHashes: string[],
    capacity: string,
    receiveAddress: string,
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ) => {
    const { codeHash, outPoint, hashType } = await LockUtils.systemScript()
    const blake160: string = LockUtils.addressToBlake160(receiveAddress)
    const daoScriptInfo = await DaoUtils.daoScript()

    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const capacityInt: bigint = BigInt(capacity)

    const sizeWithoutInputs: number = TransactionGenerator.txSerializedSizeInBlockWithoutInputsForDeposit()
    const feeWithoutInputs: bigint = TransactionGenerator.txFee(sizeWithoutInputs, feeRateInt)

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

    const outputs: Cell[] = [output]

    let gatherCapacities = capacityInt
    if(mode.isFeeRateMode()) {
      gatherCapacities = capacityInt + feeWithoutInputs
    }

    const {
      inputs,
      capacities,
      needFee
    } = await CellsService.gatherInputs(
      gatherCapacities.toString(),
      lockHashes,
      fee,
      feeRate,
    )
    const needFeeInt = BigInt(needFee)
    const totalFee = feeWithoutInputs + needFeeInt

    // change
    if (
      mode.isFeeMode() && BigInt(capacities) > capacityInt + feeInt ||
      mode.isFeeRateMode() && BigInt(capacities) > capacityInt + feeWithoutInputs + needFeeInt
    ) {
      const changeBlake160: string = LockUtils.addressToBlake160(changeAddress)
      let changeCapacity = BigInt(capacities) - capacityInt - feeInt
      if (mode.isFeeRateMode()) {
        changeCapacity = BigInt(capacities) - capacityInt - totalFee
      }

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
    }

    return {
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
      inputs,
      outputs,
      outputsData: outputs.map(output => output.data || '0x'),
      witnesses: [],
    }
  }
}

export default TransactionGenerator
