import { CapacityUnit } from 'utils/const'

export const initState = {
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
