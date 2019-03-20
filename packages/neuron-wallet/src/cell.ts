import asw from './wallets/asw'
import ckbCore from './core'

export interface OutPoint {
  hash: string
  index: number
}

interface Script {
  version: number
  args: string[]
  signedArgs: string[]
  reference?: string | null
  binary?: string
}

export interface Cell {
  capacity: number
  data: string
  lock: string
  type?: Script | null
  outPoint?: OutPoint
}

export const getUnspentCells = async () => {
  const cells = await asw.getUnspentCells()
  return cells
}

export const getLiveCell = async (outPoint: OutPoint) => {
  const liveCell = await ckbCore.rpc.getLiveCell(outPoint)
  return liveCell
}

export default {
  getUnspentCells,
  getLiveCell,
}
