import { CapacityUnit } from 'utils/const'

const appState: State.App = {
  tipBlockNumber: '',
  tipBlockHash: '',
  tipBlockTimestamp: 0,
  chain: '',
  difficulty: BigInt(0),
  epoch: '',
  send: {
    txID: '',
    outputs: [
      {
        address: '',
        amount: '',
        unit: CapacityUnit.CKB,
      },
    ],
    price: '1000',
    description: '',
    generatedTx: '',
  },
  passwordRequest: {
    actionType: null,
    walletID: '',
    password: '',
  },
  messages: {
    networks: null,
    send: null,
    transaction: null,
    transactions: null,
    wizard: null,
  },
  popups: [],
  notifications: [],
  loadings: {
    sending: false,
    addressList: false,
    transactionList: false,
    network: false,
  },
  showTopAlert: false,
  showAllNotifications: false,
  isAllowedToFetchList: true,
}

export default appState
