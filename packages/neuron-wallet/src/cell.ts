import asw from './wallets/asw'
import ckbCore from './core'
import { getCellChanges, storeCells } from './mock_rpc'

export interface OutPoint {
  hash: string
  index: number
}

export interface Script {
  version: number
  args?: string[]
  signedArgs: string[]
  reference?: string | null
  binary?: string
}

// FIXME: should update capacity to string
export interface Cell {
  capacity: number
  data: string
  lock: string
  type?: Script | null
  outPoint?: OutPoint
  state?: string
  stateChange?: string
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
export const loadCellsFromChain = async () => {
  const cells = await getCellChanges()
  cells.forEach(cell => {
    if (cell.stateChange === 'created') {
      saveCell(cell)
    } else if (cell.stateChange === 'spent') {
      markCellSpent(cell)
    }
    // any stateChange else would be ignored
  })
}

// different wallet has different cells and txs
export const getCellsByWallet = async (_page: number, _perPage: number, _walletID: string) => {
  const cells = storeCells

  return {
    totalCount: cells.length,
    cells,
  }
}

export default {
  getUnspentCells,
  getLiveCell,
}
