import { CapacityUnit } from 'utils/const'

export const initState = {
  send: {
    outputs: [
      {
        address: '',
        amount: '',
        unit: CapacityUnit.CKB,
      },
    ],
    price: '0',
    description: '',
    submitting: false,
  },
  loadings: {
    transaction: false,
    transactions: false,
  },
  errorMsgs: {
    networks: '',
    send: '',
    transaction: '',
    transactions: '',
    wizard: '',
  },
  dialog: { open: false } as { open: boolean; [index: string]: any },
}

export default initState
