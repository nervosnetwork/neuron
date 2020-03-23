import { getConnection, In } from 'typeorm'
import OutputEntity from 'database/chain/entities/output'
import { CapacityNotEnough, CapacityNotEnoughForChange, LiveCapacityNotEnough } from 'exceptions'
import FeeMode from 'models/fee-mode'
import TransactionEntity from 'database/chain/entities/transaction'
import TransactionSize from 'models/transaction-size'
import TransactionFee from 'models/transaction-fee'
import Cell, { OutputStatus } from 'models/chain/output'
import { TransactionStatus } from 'models/chain/transaction'
import OutPoint from 'models/chain/out-point'
import Input from 'models/chain/input'
import WitnessArgs from 'models/chain/witness-args'
import MultiSign from 'models/multi-sign'
import InputEntity from 'database/chain/entities/input'

export const MIN_CELL_CAPACITY = '6100000000'

export interface PaginationResult<T = any> {
  totalCount: number
  items: T[]
}

export enum CustomizedLock {
  SingleMultiSign = "SingleMultiSign"
}

export default class CellsService {
  // exclude hasData = true and typeScript != null
  public static async getBalance(lockHashes: Set<string>): Promise<{
    liveBalance: Map<string, string>
    sentBalance: Map<string, string>
    pendingBalance: Map<string, string>
  }> {
    const cells: { status: string, lockHash: string, sumOfCapacity: string }[] = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .select('output.status', 'status')
      .addSelect('output.lockHash', 'lockHash')
      .addSelect('CAST(SUM(CAST(output.capacity AS UNSIGNED BIG INT)) AS VARCHAR)', 'sumOfCapacity')
      .where({
        lockHash: In([...lockHashes]),
        hasData: false,
        typeScript: null,
      })
      .groupBy('output.lockHash')
      .addGroupBy('output.status')
      .getRawMany()

    const liveBalance = new Map<string, string>()
    const sentBalance = new Map<string, string>()
    const pendingBalance = new Map<string, string>()

    cells.forEach(c => {
      const lockHash: string = c.lockHash
      const sumOfCapacity: string = c.sumOfCapacity
      if (c.status === OutputStatus.Live) {
        liveBalance.set(lockHash, sumOfCapacity)
      } else if (c.status === OutputStatus.Sent) {
        sentBalance.set(lockHash, sumOfCapacity)
      } else if (c.status === OutputStatus.Pending) {
        pendingBalance.set(lockHash, sumOfCapacity)
      }
    })

    return {
      liveBalance,
      sentBalance,
      pendingBalance,
    }
  }

  public static async getDaoCells(lockHashes: string[]): Promise<Cell[]> {
    const outputs: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .leftJoinAndSelect('output.transaction', 'tx')
      .where(`output.daoData IS NOT NULL AND (output.status = :liveStatus OR output.status = :sentStatus OR tx.status = :failedStatus OR (output.status = :deadStatus AND output.depositTxHash is not null)) AND output.lockHash in (:...lockHashes)`, {
        lockHashes,
        liveStatus: OutputStatus.Live,
        sentStatus: OutputStatus.Sent,
        failedStatus: TransactionStatus.Failed,
        deadStatus: OutputStatus.Dead,
      })
      .orderBy(`CASE output.daoData WHEN '0x0000000000000000' THEN 1 ELSE 0 END`, 'ASC')
      .addOrderBy('tx.timestamp', 'ASC')
      .getMany()

    // find deposit info
    const depositTxHashes = outputs.map(output => output.depositTxHash).filter(hash => !!hash)
    const depositTxs = await getConnection()
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .where({
        hash: In(depositTxHashes)
      })
      .getMany()
    const depositTxMap = new Map<string, TransactionEntity>()
    depositTxs.forEach(tx => {
      depositTxMap.set(tx.hash, tx)
    })

    // find unlock info
    const unlockTxKeys: string[] = outputs.map(o => o.outPointTxHash + ':' + o.outPointIndex)
    const inputs: InputEntity[] = await getConnection()
      .getRepository(InputEntity)
      .createQueryBuilder('input')
      .leftJoinAndSelect('input.transaction', 'tx')
      .where(`input.outPointTxHash || ':' || input.outPointIndex IN (:...infos)`, {
        infos: unlockTxKeys
      })
      .getMany()
    const unlockTxMap = new Map<string, TransactionEntity>()
    inputs.forEach(i => {
      const key = i.outPointTxHash + ':' + i.outPointIndex
      unlockTxMap.set(key, i.transaction!)
    })

    const cells: Cell[] = outputs.map(output => {
      const cell = output.toModel()
      if (!output.depositTxHash) {
        // if deposit cell, set depositInfo
        cell.setDepositInfo({
          txHash: output.transaction!.hash,
          timestamp: output.transaction!.timestamp!,
        })
      } else {
        // if not deposit cell, set deposit timestamp info, depositInfo, withdrawInfo
        const depositTx = depositTxMap.get(output.depositTxHash)!
        cell.setDepositTimestamp(depositTx.timestamp!)

        cell.setDepositInfo({
          txHash: depositTx.hash,
          timestamp: depositTx.timestamp!,
        })

        const withdrawTx = output.transaction
        cell.setWithdrawInfo({
          txHash: withdrawTx!.hash,
          timestamp: withdrawTx!.timestamp!,
        })

        if (output.status === OutputStatus.Dead) {
          // if unlocked, set unlockInfo
          const key = output.outPointTxHash + ':' + output.outPointIndex
          const unlockTx = unlockTxMap.get(key)!
          cell.setUnlockInfo({
            txHash: unlockTx.hash,
            timestamp: unlockTx.timestamp!,
          })
        }
      }

      return cell
    })

    return cells
  }

  public static async getSingleMultiSignCells(blake160s: string[], pageNo: number, pageSize: number): Promise<PaginationResult<Cell>> {
    const multiSign = new MultiSign()
    const multiSignHashes: string[] = blake160s.map(blake160 => multiSign.hash(blake160))

    const skip = (pageNo - 1) * pageSize

    // live cells, empty data, empty type, and of provided blake160s
    const query = getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('output')
      .leftJoinAndSelect('output.transaction', 'tx')
      .where(`output.status = :liveStatus AND output.hasData = 0 AND output.typeScript IS NULL AND output.multiSignBlake160 IN (:...multiSignHashes)`, {
        liveStatus: OutputStatus.Live,
        multiSignHashes,
      })

    const totalCount: number = await query.getCount()

    const outputs: OutputEntity[] = await query
      .orderBy('tx.timestamp', 'ASC')
      .skip(skip)
      .take(pageSize)
      .getMany()

    const cells: Cell[] = outputs.map(o => {
      const cell = o.toModel()
      cell.setCustomizedAssetInfo({
        lock: CustomizedLock.SingleMultiSign,
        type: '',
        data: ''
      })
      return cell
    })

    return {
      totalCount: totalCount || 0,
      items: cells,
    }
  }

  public static getLiveCell = async (outPoint: OutPoint): Promise<Cell | undefined> => {
    const cellEntity: OutputEntity | undefined = await CellsService.getLiveCellEntity(outPoint)

    if (!cellEntity) {
      return undefined
    }

    return cellEntity.toModel()
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
    feeRate: string = '0',
    baseSize: number = 0,
    changeOutputSize: number = 0,
    changeOutputDataSize: number = 0,
    append?: {
      input: Input,
      witness: WitnessArgs,
    }
  ): Promise<{
    inputs: Input[]
    capacities: string
    finalFee: string
    hasChangeOutput: boolean
  }> => {
    const capacityInt = BigInt(capacity)
    const feeInt = BigInt(fee)
    const feeRateInt = BigInt(feeRate)
    let needFee = BigInt(0)
    const changeOutputFee: bigint = TransactionFee.fee(changeOutputSize + changeOutputDataSize, feeRateInt)

    const mode = new FeeMode(feeRateInt)

    // use min secp size (without data)
    const minChangeCapacity = BigInt(MIN_CELL_CAPACITY)

    // only live cells, skip which has data or type
    const cellEntities: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .find({
        where: {
          lockHash: In(lockHashes),
          status: In([OutputStatus.Live, OutputStatus.Sent]),
          hasData: false,
          typeScript: null,
        },
      })
    const liveCells = cellEntities.filter(c => c.status === OutputStatus.Live)
    const sentBalance: bigint = cellEntities
      .filter(c => c.status === OutputStatus.Sent)
      .map(c => BigInt(c.capacity))
      .reduce((result, c) => result + c, BigInt(0))

    if (
      liveCells.length === 0 &&
      sentBalance === BigInt(0) &&
      (
        (mode.isFeeRateMode() && feeRateInt !== BigInt(0)) ||
        (mode.isFeeMode() && feeInt !== BigInt(0))
      )
    ) {
      throw new CapacityNotEnough()
    }
    liveCells.sort((a, b) => {
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
    let totalSize: number = baseSize
    if (append) {
      inputs.push(append.input)
      totalSize += TransactionSize.input()
      totalSize += TransactionSize.witness(append.witness)
    }
    let hasChangeOutput: boolean = false
    liveCells.every(cell => {
      const input: Input = new Input(
        cell.outPoint(),
        '0',
        cell.capacity,
        cell.lock,
        cell.lockHash
      )
      if (inputs.find(el => el.lockHash === cell.lockHash!)) {
        totalSize += TransactionSize.emptyWitness()
      } else {
        totalSize += TransactionSize.secpLockWitness()
      }
      inputs.push(input)
      inputCapacities += BigInt(cell.capacity)
      totalSize += TransactionSize.input()

      if (mode.isFeeRateMode()) {
        needFee = TransactionFee.fee(totalSize, feeRateInt)
        const diff = inputCapacities - capacityInt - needFee
        if (diff === BigInt(0)) {
          hasChangeOutput = false
          return false
        } else if (diff - changeOutputFee >= minChangeCapacity) {
          needFee += changeOutputFee
          hasChangeOutput = true
          return false
        }
        return true
      } else {
        const diff = inputCapacities - capacityInt - feeInt
        if (diff === BigInt(0)) {
          hasChangeOutput = false
          return false
        } else if (diff >= minChangeCapacity) {
          hasChangeOutput = true
          return false
        }
        return true
      }
    })

    // The final fee need in this tx (shannon)
    const finalFee: bigint = mode.isFeeRateMode() ? needFee : feeInt

    const totalCapacities = capacityInt + finalFee

    if (inputCapacities < totalCapacities) {
      if (inputCapacities + sentBalance >= totalCapacities) {
        throw new LiveCapacityNotEnough()
      }
      throw new CapacityNotEnough()
    }

    const diffCapacities = inputCapacities - totalCapacities
    if (diffCapacities < minChangeCapacity && diffCapacities !== BigInt(0)) {
      if (diffCapacities + sentBalance === BigInt(0) || diffCapacities + sentBalance >= minChangeCapacity) {
        throw new LiveCapacityNotEnough()
      }
      throw new CapacityNotEnoughForChange()
    }

    return {
      inputs,
      capacities: inputCapacities.toString(),
      finalFee: finalFee.toString(),
      hasChangeOutput,
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
      return new Input(
        cell.outPoint(),
        '0',
        cell.capacity,
        cell.lock,
        cell.lockHash,
      )
    })

    return inputs
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
