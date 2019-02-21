import { createContext } from 'react'
import { NetworkStatus } from '../utils/const'

// these will be introduced by sdk
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
    status: NetworkStatus
  }
  tipBlockNumber?: number
}

export const initChain: IChain = {
  cells: [],
  network: {
    ip: '',
    status: NetworkStatus.Offline,
  },
  tipBlockNumber: undefined,
}

const ChainContext = createContext<IChain>(initChain)
export default ChainContext
