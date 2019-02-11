import { createContext } from 'react'
import { NETWORK_STATUS } from '../utils/const'

export interface ICell {
  capacity: number
  data: Uint8Array
  lock: string
  type?: {
    version: number
    args: Uint8Array[]
    signedArgs: Uint8Array[]
    reference: string
    binary: Uint8Array
  }
  outPoint: {
    hash: string
    index: number
  }
}

export interface IChain {
  cells: ICell[]
  network: {
    ip: string
    status: NETWORK_STATUS
  }
  tipBlockNumber?: number
}

export const initChain: IChain = {
  cells: [],
  network: {
    ip: '',
    status: NETWORK_STATUS.OFFLINE,
  },
  tipBlockNumber: undefined,
}

const ChainContext = createContext<IChain>(initChain)
export default ChainContext
