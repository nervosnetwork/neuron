import { CapacityUnit } from '../../utils/const'

export const initState = {
  tempWallet: {
    name: '',
    password: '',
    mnemonic: '',
  },
  transfer: {
    items: [
      {
        address: '',
        capacity: '',
        unit: CapacityUnit.CKB,
      },
    ],
    submitting: false,
  },
  networkEditor: {
    name: '',
    remote: '',
  },
  loadings: {
    transaction: false,
    transactions: false,
  },
  errorMsgs: {
    networks: '',
    transfer: '',
    transaction: '',
    transactions: '',
  },
  password: '',
  dialog: {
    open: false,
  } as { open: boolean; [index: string]: any },
}

export default initState
