import { getConnection, In } from 'typeorm'
import OutputEntity from 'database/chain/entities/output'
import { Cell, OutPoint, Input } from 'types/cell-types'
import { CapacityNotEnough, CapacityNotEnoughForChange } from 'exceptions'
import { OutputStatus } from './tx/params'
import FeeMode from 'models/fee-mode'
import { TransactionStatus } from 'types/cell-types'
import TransactionEntity from 'database/chain/entities/transaction'

export const MIN_CELL_CAPACITY = '6100000000'

export default class CellsService {
  // exclude hasData = true and typeScript != null
  public static getBalance = async (
    lockHashes: string[],
    status: OutputStatus
  ): Promise<string> => {
    const cells: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .select([
        "output.lockHash",
        "output.status",
        "output.hasData",
        "output.typeScript",
        "output.capacity"
      ])
      .where({
        lockHash: In(lockHashes),
        status,
        hasData: false,
        typeScript: null,
      })
      .getMany()

    const capacity: bigint = cells.map(c => BigInt(c.capacity)).reduce((result, c) => result + c, BigInt(0))

    return capacity.toString()
  }

  public static getDaoCells = async (
    lockHashes: string[],
  ): Promise<Cell[]> => {
    const outputs: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .leftJoinAndSelect('output.transaction', 'tx')
      .where(`(output.status = :liveStatus OR tx.status = :failedStatus) AND output.daoData IS NOT NULL AND output.lockHash in (:...lockHashes) AND tx.blockNumber IS NOT NULL`, {
        lockHashes,
        liveStatus: OutputStatus.Live,
        failedStatus: TransactionStatus.Failed,
      })
      .orderBy(`CASE output.daoData WHEN '0x0000000000000000' THEN 1 ELSE 0 END`, 'ASC')
      .addOrderBy('tx.timestamp', 'ASC')
      .getMany()

    const cells = outputs.map(o => o.toInterface())

    const txHashes = outputs.map(output => output.depositTxHash).filter(hash => !!hash)

    const txs = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where({
        hash: In(txHashes)
      })
      .getMany()

    for (const output of cells) {
      if (output.depositOutPoint) {
        const tx = txs.filter(t => t.hash === output.depositOutPoint!.txHash)[0]
        if (tx) {
          output.depositTimestamp = tx.timestamp
        }
      }
    }

    return cells
  }

  public static getLiveCell = async (outPoint: OutPoint): Promise<Cell | undefined> => {
    const cellEntity: OutputEntity | undefined = await CellsService.getLiveCellEntity(outPoint)

    if (!cellEntity) {
      return undefined
    }

    return cellEntity.toInterface()
  }

  private static getLiveCellEntity = async (outPoint: OutPoint): Promise<OutputEntity | undefined> => {
    const cellEntity: OutputEntity | undefined = await getConnection()
      .getRepository(OutputEntity)
      .findOne({
        outPointTxHash: outPoint.txHash,
        outPointIndex: outPoint.index,
        status: 'live',
      })

    return cellEntity
  }

  // gather inputs for generateTx
  public static gatherInputs = async (
    capacity: string,
    lockHashes: string[],
    fee: string = '0',
    feeRate: string = '0'
  ): Promise<{
    inputs: Input[]
    capacities: string
    needFee: string
  }> => {
    const capacityInt = BigInt(capacity)
    const feeInt = BigInt(fee)
    // const totalCapacities: bigint = capacityInt + feeInt
    const feeRateInt = BigInt(feeRate)
    let needFee = BigInt(0)

    const mode = new FeeMode(feeRateInt)

    // use min secp size (without data)
    const minChangeCapacity = BigInt(MIN_CELL_CAPACITY)

    // if (capacityInt < BigInt(MIN_CELL_CAPACITY)) {
    //   throw new Error(`capacity can't be less than ${MIN_CELL_CAPACITY}`)
    // }

    // only live cells, skip which has data or type
    const cellEntities: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .find({
        where: {
          lockHash: In(lockHashes),
          status: OutputStatus.Live,
          hasData: false,
          typeScript: null,
        },
      })
    cellEntities.sort((a, b) => {
      const result = BigInt(a.capacity) - BigInt(b.capacity)
      if (result > BigInt(0)) {
        return 1
      }
      if (result === BigInt(0)) {
        return 0
      }
      return -1
    })

    const inputs: Input[] = []
    let inputCapacities: bigint = BigInt(0)
    cellEntities.every(cell => {
      const input: Input = {
        previousOutput: cell.outPoint(),
        since: '0',
        lock: cell.lock,
        lockHash: cell.lockHash,
        capacity: cell.capacity,
      }
      inputs.push(input)
      inputCapacities += BigInt(cell.capacity)

      let diff = inputCapacities - capacityInt - feeInt
      if (mode.isFeeRateMode()) {
        needFee += CellsService.everyInputFee(feeRateInt)
        diff = inputCapacities - capacityInt - needFee
      }
      if (diff >= minChangeCapacity || diff === BigInt(0)) {
        return false
      }
      return true
    })

    let totalCapacities = capacityInt + feeInt
    if (mode.isFeeRateMode()) {
      totalCapacities = capacityInt + needFee
    }

    if (inputCapacities < totalCapacities) {
      throw new CapacityNotEnough()
    }

    const diffCapacities = inputCapacities - totalCapacities
    if (diffCapacities < minChangeCapacity && diffCapacities !== BigInt(0)) {
      throw new CapacityNotEnoughForChange()
    }

    return {
      inputs,
      capacities: inputCapacities.toString(),
      needFee: needFee.toString(),
    }
  }

  public static gatherAllInputs = async (lockHashes: string[]): Promise<Input[]> => {
    const cellEntities: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .find({
        where: {
          lockHash: In(lockHashes),
          status: OutputStatus.Live,
          hasData: false,
          typeScript: null,
        },
      })

    const inputs: Input[] = cellEntities.map(cell => {
      return {
        previousOutput: cell.outPoint(),
        since: '0',
        lock: cell.lock,
        lockHash: cell.lockHash,
        capacity: cell.capacity,
      }
    })

    return inputs
  }

  public static everyInputFee = (feeRate: bigint): bigint => {
    const ratio = BigInt(1000)
    const base = BigInt(CellsService.everyInputSize()) * feeRate
    const fee = base / ratio
    if (fee * ratio < base) {
      return fee + BigInt(1)
    }
    return fee
  }

  public static everyInputSize = (): number => {
    /*
    * every input needs 44 Bytes
    * every input needs 1 witness signed by secp256k1, with 85 Bytes data, serialized in 89 Bytes, add extra 4 Bytes when add to transaction.
    */
    return 4 + 44 + 89
  }

  public static allBlake160s = async (): Promise<string[]> => {
    const outputEntities = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .getMany()
    const blake160s: string[] = outputEntities
      .map(output => {
        const { lock } = output
        if (!lock) {
          return undefined
        }
        const { args } = lock
        if (!args) {
          return undefined
        }
        return args
      })
      .filter(blake160 => !!blake160) as string[]

    const uniqueBlake160s = [...new Set(blake160s)]

    return uniqueBlake160s
  }
}
