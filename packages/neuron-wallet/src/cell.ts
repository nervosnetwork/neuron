import asw from './wallets/asw'
import ckbCore from './core'
import { storeCells } from './mock_rpc'

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
  data: string
  lock: Script
  type?: Script | null
  outPoint?: OutPoint
  state?: string
}

export const getUnspentCells = async () => {
  const cells = await asw.getUnspentCells()
  return cells
}

export const getLiveCell = async (outPoint: OutPoint) => {
  const liveCell = await ckbCore.rpc.getLiveCell(outPoint)
  return liveCell
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */

// save one Cell to db
// check cell exists and status
// if exists, and status right, ignore
// if exists, and status not right, update or throw(something wrong)
// if not exist, insert
export const saveCell = async (cell: Cell) => {
  return cell
}

// marked a cell used
// update state = 'spent'
export const markCellSpent = async (cell: Cell) => {
  return cell
}

// get cells changes from chain and save to db
export const loadCellsFromChain = async (): Promise<void> => {}

export const getCellsByLockHashes = async (_lockHashes: string[]): Promise<Cell[]> => {
  return storeCells
}

export default {
  getUnspentCells,
  getLiveCell,
}
