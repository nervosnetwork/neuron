import asw from './wallets/asw'
import ckbCore from './core'

export interface OutPoint {
  hash: string
  index: number
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
