import asw from '../wallets/asw'
import ckbCore from '../core'
import { getLiveCells } from '../mock_rpc'
import CellEntity from '../entities/Cell'

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
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */
/* eslint no-await-in-loop: "warn" */
export default class CellsService {
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
      await CellsService.create(c)
    })
  }

  public static create = async (cell: Cell) => {
    const cellEntity = new CellEntity()
    cellEntity.outPointHash = cell.outPoint!.hash
    cellEntity.outPointIndex = cell.outPoint!.index
    cellEntity.capacity = cell.capacity
    cellEntity.data = cell.data || ''
    cellEntity.lockScript = cell.lock
    cellEntity.typeScript = cell.type || null
    cellEntity.status = cell.status!

    await cellEntity.save()
    return cellEntity
  }

  public static getBalance = async (_lockHashes: string[]): Promise<string> => {
    return '1000'
  }

  public static getLiveCell = async (outPoint: OutPoint) => {
    const liveCell = await ckbCore.rpc.getLiveCell(outPoint)
    return liveCell
  }

  public static getUnspentCells = async () => {
    const cells = await asw.getUnspentCells()
    return cells
  }
}
