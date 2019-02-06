import { createContext } from 'react'
import { NETWORK_STATUS } from '../utils/const'

interface IChain {
  cells: any[]
  network: {
    ip: string
    status: NETWORK_STATUS
  }
}

const initChain = {
  cells: [],
  network: {
    ip: '',
    status: NETWORK_STATUS.OFFLINE,
  },
}

const ChainContext = createContext<IChain>(initChain)
export default ChainContext
