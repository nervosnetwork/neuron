import { CapacityUnit } from 'utils/const'

const appState: State.App = {
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
    loading: false,
  },
  messages: {
    networks: null,
    send: null,
    transaction: null,
    transactions: null,
    wizard: null,
  },
  notifications: [],
}

export default appState
