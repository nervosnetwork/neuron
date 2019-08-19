export interface TransactionSendTo {
  address: string
  amount: number
}

export interface TransactionTestEnv {
  // Used to test sending transactions, please make sure there is enough balance.
  mnemonic: string,
  sendTo: TransactionSendTo[]
}

export interface TestEnv {
  transaction: TransactionTestEnv
}

const env: TestEnv = {
  transaction: {
    mnemonic: '',
    sendTo: []
  }
}

export default env;