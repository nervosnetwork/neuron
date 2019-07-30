import { TransactionWithoutHash, Cell, ScriptHashType } from '../../types/cell-types'
import CellsService, { MIN_CELL_CAPACITY } from '../cells'
import LockUtils from '../../models/lock-utils'
import { CapacityTooSmall } from '../../exceptions'
import { TargetOutput } from './params'

export class GenerateTransaction {
  // lockHashes for each inputs
  public static generateTx = async (
    lockHashes: string[],
    targetOutputs: TargetOutput[],
    changeAddress: string,
    fee: string = '0'
  ): Promise<TransactionWithoutHash> => {
    const { codeHash, outPoint } = await LockUtils.systemScript()

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
          args: [blake160],
          hashType: ScriptHashType.Data,
        },
      }

      return output
    })

    const { inputs, capacities } = await CellsService.gatherInputs(needCapacities.toString(), lockHashes, fee)

    // change
    if (BigInt(capacities) > needCapacities + BigInt(fee)) {
      const changeBlake160: string = LockUtils.addressToBlake160(changeAddress)

      const output: Cell = {
        capacity: `${BigInt(capacities) - needCapacities - BigInt(fee)}`,
        data: '0x',
        lock: {
          codeHash,
          args: [changeBlake160],
          hashType: ScriptHashType.Data,
        },
      }

      outputs.push(output)
    }

    return {
      version: '0',
      deps: [outPoint],
      inputs,
      outputs,
      witnesses: [],
    }
  }
}

export default GenerateTransaction
