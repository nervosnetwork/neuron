import { CapacityUnit } from '../../utils/const'

export const initState = {
  mnemonic: {
    generated: '',
    imported: '',
    name: '',
    password: '',
    confirmPassword: '',
  },
  tempWallet: {
    name: '',
    password: '',
    mnemonic: '',
    keystore: '',
  },
  createWallet: {
    name: '',
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
    wizard: '',
  },
  password: '',
  dialog: { open: false } as { open: boolean; [index: string]: any },
}

export default initState
