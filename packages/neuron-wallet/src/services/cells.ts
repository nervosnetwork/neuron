import { getConnection, In } from 'typeorm'
import asw from '../wallets/asw'
import { getLiveCells } from '../mock_rpc'
import OutputEntity from '../entities/Output'

export interface OutPoint {
  hash: string
  index: number
}

export interface Script {
  args?: string[]
  binaryHash?: string | null
}

// FIXME: should update capacity to string
export interface Cell {
  capacity: string
  data?: string
  lock: Script
  type?: Script | null
  outPoint?: OutPoint
  status?: string
  lockHash?: string
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */
/* eslint no-await-in-loop: "warn" */
/* eslint no-restricted-syntax: "warn" */
export default class CellsService {
  public static getLiveCellsByLockHashes = async (lockHashes: string[]): Promise<Cell[]> => {
    const totalCells: Cell[] = []

    for (const lockHash of lockHashes) {
      const cells = await CellsService.getLiveCellsByLockHash(lockHash)
      totalCells.concat(cells)
    }

    return totalCells
  }

  public static getLiveCellsByLockHash = async (_lockHash: string): Promise<Cell[]> => {
    const to = 100
    let currentFrom = 0
    let cells: Cell[] = []
    while (currentFrom <= to) {
      const currentTo = Math.min(currentFrom + 100, to)
      const cs = await getLiveCells()
      cells = cells.concat(cs)
      currentFrom = currentTo + 1
    }
    return cells
  }

  public static loadCellsFromChain = async (lockHash: string): Promise<void> => {
    const cells = await CellsService.getLiveCellsByLockHash(lockHash)
    cells.forEach(async cell => {
      const c = cell
      c.status = 'live'
      c.lockHash = Math.round(Math.random() * 1000).toString()
      await CellsService.create(c)
    })
  }

  public static create = async (cell: Cell) => {
    const cellEntity = new OutputEntity()
    cellEntity.outPointHash = cell.outPoint!.hash
    cellEntity.outPointIndex = cell.outPoint!.index
    cellEntity.capacity = cell.capacity
    cellEntity.data = cell.data || ''
    cellEntity.lock = cell.lock
    cellEntity.type = cell.type || null
    cellEntity.status = cell.status!
    cellEntity.lockHash = cell.lockHash!

    await cellEntity.save()
    return cellEntity
  }

  public static getBalance = async (lockHashes: string[]): Promise<string> => {
    const cells: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .find({
        where: { lockHash: In(lockHashes) },
      })

    const capacity: bigint = cells.map(c => BigInt(c.capacity)).reduce((result, c) => result + c, BigInt(0))

    return capacity.toString()
  }

  public static getLiveCell = async (outPoint: OutPoint): Promise<Cell | undefined> => {
    const cellEntity: OutputEntity | undefined = await CellsService.getCellEntity(outPoint)

    if (!cellEntity) {
      return cellEntity
    }

    const cell: Cell = {
      outPoint: {
        hash: cellEntity.outPointHash,
        index: cellEntity.outPointIndex,
      },
      capacity: cellEntity.capacity,
      lockHash: cellEntity.lockHash,
      lock: cellEntity.lock,
    }

    return cell
  }

  private static getCellEntity = async (outPoint: OutPoint): Promise<OutputEntity | undefined> => {
    const cellEntity: OutputEntity | undefined = await getConnection()
      .getRepository(OutputEntity)
      .createQueryBuilder('cell')
      .where('cell.outPointHash = :outPointHash and cell.outPointIndex = :outPointIndex', {
        outPointHash: outPoint.hash,
        outPointIndex: outPoint.index,
      })
      .getOne()

    return cellEntity
  }

  public static getUnspentCells = async () => {
    const cells = await asw.getUnspentCells()
    return cells
  }
}
