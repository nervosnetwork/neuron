import { TransactionWithoutHash, Cell, DepType, Input, OutPoint } from 'types/cell-types'
import CellsService, { MIN_CELL_CAPACITY } from 'services/cells'
import LockUtils from 'models/lock-utils'
import { CapacityTooSmall } from 'exceptions'
import { TargetOutput } from './params'
import DaoUtils from 'models/dao-utils'
import FeeMode from 'models/fee-mode'
import TransactionSize from 'models/transaction-size'
import TransactionFee from 'models/transaction-fee'

export class TransactionGenerator {
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

  // rest of capacity all send to last target output.
  public static generateAllTx = async (
    lockHashes: string[],
    targetOutputs: TargetOutput[],
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<TransactionWithoutHash> => {
    const { codeHash, outPoint, hashType } = await LockUtils.systemScript()

    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    const mode = new FeeMode(feeRateInt)

    const allInputs: Input[] = await CellsService.gatherAllInputs(lockHashes)
    const totalCapacity: bigint = allInputs
      .map(input => BigInt(input.capacity))
      .reduce((result, c) => result + c, BigInt(0))

    const minCellCapacity = BigInt(MIN_CELL_CAPACITY)
    const outputs: Cell[] = targetOutputs.map((o, index) => {
      const { capacity, address } = o

      // skip last output
      if (BigInt(capacity) < minCellCapacity && index !== targetOutputs.length - 1) {
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
        }
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
      const lockHashes = new Set(allInputs.map(i => i.lockHash!))
      const keyCount: number = lockHashes.size
      const txSize: number = TransactionSize.tx(tx) +
        TransactionSize.secpLockWitness() * keyCount +
        TransactionSize.emptyWitness() * (allInputs.length - keyCount)
      finalFee = TransactionFee.fee(txSize, feeRateInt)
    }

    const capacitiesExceptLast: bigint = outputs
      .slice(0, -1)
      .map(o => BigInt(o.capacity))
      .reduce((result, c) => result + c, BigInt(0))
    outputs[outputs.length - 1].capacity = (totalCapacity - capacitiesExceptLast - finalFee).toString()
    tx.fee = finalFee.toString()

    // check
    if (outputs.map(o => BigInt(o.capacity)).reduce((result, c) => result + c, BigInt(0)) + finalFee !== totalCapacity) {
      throw new Error('generateAllTx Error')
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
      const lockHashes = new Set(allInputs.map(i => i.lockHash!))
      const keyCount: number = lockHashes.size
      const txSize: number = TransactionSize.tx(tx) +
        TransactionSize.secpLockWitness() * keyCount +
        TransactionSize.emptyWitness() * (allInputs.length - keyCount)
      finalFee = TransactionFee.fee(txSize, feeRateInt)
    }

    output.capacity = (BigInt(output.capacity) - finalFee).toString()
    tx.fee = finalFee.toString()

    return tx
  }

  public static startWithdrawFromDao = async (
    lockHashes: string[],
    outPoint: OutPoint,
    prevOutput: Cell,
    depositBlockNumber: string,
    depositBlockHash: string,
    changeAddress: string,
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<TransactionWithoutHash> => {
    const { codeHash, outPoint: secpOutPoint, hashType } = await LockUtils.systemScript()
    const daoScriptInfo = await DaoUtils.daoScript()

    const output = prevOutput
    const buf = Buffer.alloc(8)
    buf.writeBigUInt64LE(BigInt(depositBlockNumber))
    output.data = `0x${buf.toString('hex')}`
    output.typeHash = LockUtils.computeScriptHash(output.type!)
    output.daoData = output.data
    output.depositOutPoint = outPoint

    const outputs: Cell[] = [output]

    const tx: TransactionWithoutHash = {
      version: '0',
      cellDeps: [
        {
          outPoint: secpOutPoint,
          depType: DepType.DepGroup,
        },
        {
          outPoint: daoScriptInfo.outPoint,
          depType: DepType.Code,
        },
      ],
      headerDeps: [
        depositBlockHash,
      ],
      inputs: [],
      outputs,
      outputsData: outputs.map(o => o.data || '0x'),
      witnesses: [],
    }

    const baseSize: number = TransactionSize.tx(tx)

    const input: Input = {
      previousOutput: outPoint,
      since: '0',
      lock: output.lock,
      lockHash: LockUtils.lockScriptToHash(output.lock),
      capacity: output.capacity,
    }

    const append = {
      input,
      witness: {
        lock: '0x' + '0'.repeat(130),
        inputType: undefined,
        outputType: undefined,
      }
    }

    const {
      inputs,
      capacities,
      finalFee,
      hasChangeOutput,
    } = await CellsService.gatherInputs(
      '0',
      lockHashes,
      fee,
      feeRate,
      baseSize,
      TransactionGenerator.CHANGE_OUTPUT_SIZE,
      TransactionGenerator.CHANGE_OUTPUT_DATA_SIZE,
      append
    )
    const finalFeeInt = BigInt(finalFee)

    tx.inputs = inputs
    tx.fee = finalFee

    // change
    if (hasChangeOutput) {
      const changeBlake160: string = LockUtils.addressToBlake160(changeAddress)
      const changeCapacity = BigInt(capacities) - finalFeeInt

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

    return tx
  }
}

export default TransactionGenerator
