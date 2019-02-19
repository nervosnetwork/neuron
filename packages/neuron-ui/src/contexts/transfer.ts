import { createContext } from 'react'

interface ITransfer {
  fee: number
}

export const initTransfer: ITransfer = {
  fee: 10,
}

const TransferContext = createContext<ITransfer>(initTransfer)
export default TransferContext
