import { TransactionWithoutHash, Cell, DepType } from 'types/cell-types'
import CellsService, { MIN_CELL_CAPACITY } from 'services/cells'
import LockUtils from 'models/lock-utils'
import { CapacityTooSmall } from 'exceptions'
import { TargetOutput } from './params'

export class TransactionGenerator {
  private static txSerializedSizeInBlockWithoutInputs = (outputLength: number) : number => {
    return 4 + 68 + 37 * 1 + (4 + 97 + 4 + 4) * outputLength
  }

  private static txFee = (size: number, feeRate: bigint) => {
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
    let mode: 'fee' | 'feeRate' = 'fee'
    if (feeRateInt > 0) {
      mode = 'feeRate'
    }

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
    if (mode === 'feeRate') {
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
    if (mode === 'fee' && BigInt(capacities) > needCapacities + feeInt || mode === 'feeRate' && BigInt(capacities) > needCapacities + feeWithoutInputs + needFeeInt) {
      const changeBlake160: string = LockUtils.addressToBlake160(changeAddress)

      let changeCapacity = BigInt(capacities) - needCapacities - feeInt
      if (mode === 'feeRate') {
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
}

export default TransactionGenerator
