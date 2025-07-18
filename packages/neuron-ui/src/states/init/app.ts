import { CapacityUnit, ErrorCode } from 'utils'
import { INIT_SEND_PRICE } from 'utils/const'

const initNotifications: Array<State.Message> = [
  {
    type: 'warning',
    timestamp: Date.now(),
    code: ErrorCode.WaitForFullySynced,
  },
]

export const appState: State.App = {
  tipBlockNumber: '',
  tipBlockTimestamp: 0,
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
    generatedTx: null,
    isSendMax: false,
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
  notifications: initNotifications,
  globalAlertDialog: null,
  loadings: {
    sending: false,
    addressList: false,
    transactionList: false,
  },
  showTopAlert: !!initNotifications.length,
  showAllNotifications: false,
  isAllowedToFetchList: true,
  loadedTransaction: null,
  showWaitForFullySynced: true,
}

export default appState
