import { CapacityUnit, CONSTANTS } from 'utils'

const { INIT_SEND_PRICE } = CONSTANTS

export const appState: Readonly<State.App> = {
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
        address: undefined,
        amount: undefined,
        unit: CapacityUnit.CKB,
        date: undefined,
      },
    ],
    price: INIT_SEND_PRICE,
    description: '',
    generatedTx: '',
  },
  passwordRequest: {
    actionType: null,
    walletID: '',
  },
  messages: {
    networks: null,
    send: null,
    transaction: null,
    transactions: null,
    wizard: null,
  },
  popups: [],
  globalDialog: null,
  notifications: [],
  alertDialog: null,
  loadings: {
    sending: false,
    addressList: false,
    transactionList: false,
  },
  showTopAlert: false,
  showAllNotifications: false,
  isAllowedToFetchList: true,
}

export default appState
