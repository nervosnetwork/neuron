import { createContext } from 'react'

interface Transfer {
  fee: number
}

export const initTransfer: Transfer = {
  fee: 10,
}

const TransferContext = createContext<Transfer>(initTransfer)
export default TransferContext
