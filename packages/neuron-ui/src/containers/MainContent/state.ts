import { CapacityUnit } from '../../utils/const'

export const initState = {
  tempWallet: {
    walletName: '',
    password: '',
    mnemonic: '',
    keystore: '',
  },
  createWallet: {
    walletName: '',
    password: '',
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
